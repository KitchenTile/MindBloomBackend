import { pipeline } from "@xenova/transformers";
import fs from "fs";
import { readFileSync } from "fs";
import { supabase } from "../config/db.js";
import { PDFParse } from "pdf-parse";
import { readFile } from "node:fs/promises";
import OpenAI from "openai";

const generateEmbedding = await pipeline(
  "feature-extraction",
  "Supabase/gte-small"
);

interface chunkEmbeddings {
  chapter: number;
  content: string;
  embedding: number[];
}

export const bookHandler = async (file_dir: string) => {
  //get metada + embeddings from the imputted file
  const fileData = await dataProcessor(file_dir);

  //chop book and return chunks + embeddings
  const embeddings = fileData.result;

  const metadata = fileData.metadataExtractor.slice(0, 1000);

  const chapters = embeddings[embeddings.length - 1].chapter;

  // get the metadata from the gpt call
  const { topic, title, author, year } = JSON.parse(
    await getGptMetadata(metadata)
  );

  // upload book metadata and return id
  const bookId = await bookUpload(topic, title, author, year, chapters);

  //upload chunks
  const data = await chunkUpload(bookId, embeddings);

  console.log(data);

  return data;
};

// first step of the injection pipeline - loading, chunking and embedding
const dataProcessor = async (
  file_dir: string
): Promise<{ metadataExtractor: string; result: chunkEmbeddings[] }> => {
  try {
    const fileExtension = getFileExtension(file_dir);
    let data: string;

    switch (fileExtension) {
      case "pdf":
        console.log("PDF");
        const buffer = await readFile(file_dir);
        const parser = new PDFParse({ data: buffer });
        const textResult = await parser.getText();

        await parser.destroy();
        data = textResult.text;
        break;
      case "txt":
        console.log("TXT");
        data = await fs.promises.readFile(file_dir, { encoding: "utf-8" });
        break;
      case "md":
        console.log("MD");
        data = await fs.promises.readFile(file_dir, { encoding: "utf-8" });
        break;
    }

    // get book metadata and chapters
    const { metadataExtractor, chapterObj } = chapterSplitter(data);

    // split chapters into chunks
    const chunks = chapterObj.map((chapter) => ({
      chunks: recursiveTextChunkSplitter(chapter.content, 1000),
      chapter: chapter.chapterNumber,
    }));

    // return an array of objects each containing chapter, content and embeddings
    const result = await Promise.all(
      chunks.flatMap((chunkObj) => {
        return chunkObj.chunks.map(async (chunk) => ({
          chapter: chunkObj.chapter,
          content: chunk,
          embedding: (
            await generateEmbedding(chunk, {
              pooling: "mean",
              normalize: true,
            })
          ).tolist() as number[],
        }));
      })
    );
    return { metadataExtractor, result };
  } catch (error) {
    console.log(error);
  }
};

//upsert and handle the chunks (insert or upload)
const chunkUpload = async (
  book_id: string,
  embeddings: { chapter: number; content: string; embedding: number[] }[]
) => {
  try {
    const bookId = book_id;
    const chunksToUpsert = embeddings.map(
      (e: { chapter: number; content: string; embedding: number[] }, index) => {
        const chunkObject = {
          book_id: bookId,
          chapter: e.chapter,
          chunk_content: e.content,
          chunk_order: index,
          embedding: e.embedding[0],
        };
        return chunkObject;
      }
    );

    const { data, error } = await supabase
      .from("book_chunks")
      .upsert(chunksToUpsert, { onConflict: "book_id, chapter, chunk_order" })
      .select();

    if (error) return error;

    return data;
  } catch (error) {
    console.log(error);
  }
};

// upload the metadata to the database
const bookUpload = async (
  topic: string,
  title: string,
  author: string[],
  year: number,
  chapters: number
): Promise<string> => {
  try {
    console.log("data");
    console.log(topic, title, author.join(), year);
    const authorStr = author.join();
    const { data, error } = await supabase
      .from("books")
      .insert({
        title: title,
        author: authorStr,
        topic: topic,
        chapters: 3,
        year: year,
      })
      .select("id");

    if (error) console.log(error);

    console.log(data);

    if (data && data.length > 0) {
      return data[0].id;
    }

    return null;
  } catch (error) {
    console.log(error);
  }
};

const getFileExtension = (filename: string): string | null => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() : null;
};

//feed gpt an amount of text (undetermined) and ask to get the metadata we need
const getGptMetadata = async (textExtract: string) => {
  try {
    //init gpt client
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    //ask gpt for metadata
    const gptReply = await client.chat.completions.create({
      model: "gpt-5",
      // text: { type: "json_schema" },
      response_format: { type: "json_object" },

      messages: [
        {
          role: "system",
          content: `
          You are an expert Librarian and Metadata Extractor. Your task is to analyze the provided text snippet, identify the full title and author of the book, and then use your knowledge and external search tools to find the required publication details.

          1. **Required Fields:** You MUST return a single JSON object with the following four keys.
            - "topic": (The book's topic from the following options: "Biology", "English", "Computer Science", "History")
            - "title": (The full book title as a string)
            - "author": (The full name of the author, as an array of strings)
            - "year": (The year of publication as a number)

          2. **Output Rule:** Your entire response MUST be valid JSON. DO NOT include any introductory or concluding text.
          `,
        },
        {
          role: "user",
          content: `pelase find the following book and its information ${textExtract}`,
        },
      ],
    });
    const bookMetadata = gptReply.choices[0].message.content;

    // const bookMetadata = {
    //   topic: "Computer Science",
    //   title:
    //     "The Full-Stack Developer: Your Essential Guide to the Everyday Skills Expected of a Modern Full-Stack Web Developer",
    //   author: ["Chris Northwood"],
    //   year: 2018,
    // };

    console.log(bookMetadata);

    return bookMetadata;
  } catch (error) {
    console.log(error);
  }
};

const recursiveTextChunkSplitter = (text: string, chunkLength: number) => {
  const textSeparator = [
    "\n\n",
    "\n",
    " ",
    ".",
    ",",
    "\u200b",
    "\uff0c",
    "\u3001",
    "\uff0e",
    "\u3002",
    "",
  ];

  const combinedChunks: string[] = [];
  let currentChunk = "";

  //If text is short enough, return it as a single chunk
  if (text.length < chunkLength) {
    return [text];
  } else {
    let textPieces: string[] = [text];

    // Find the largest separator present and split the text
    for (const separator of textSeparator) {
      if (text.includes(separator)) {
        // Splitting the main text variable
        textPieces = text.split(separator);
        break;
      }
    }

    // Make sure every piece is broken down smaller than chunkLength
    const recursivelyChunkedPieces = textPieces.flatMap((piece) =>
      recursiveTextChunkSplitter(piece, chunkLength)
    );

    // assemble the pieces into final chunks
    for (const piece of recursivelyChunkedPieces) {
      // Check if adding the new piece overflows the chunk limit
      if (currentChunk.length + piece.length + 1 > chunkLength) {
        combinedChunks.push(currentChunk);
        currentChunk = piece;
      } else {
        currentChunk += (currentChunk ? " " : "") + piece;
      }
    }

    if (currentChunk) {
      combinedChunks.push(currentChunk);
    }

    return combinedChunks;
  }
};

//Large books need to be subdivided into chapters and THEN into chunks
const chapterSplitter = (
  data: string
): {
  metadataExtractor: string;
  chapterObj: { chapterNumber: number; content: string }[];
} => {
  //split data into chapters and return an array of chapters
  const split = data.split("### Chapter");

  // use this to feed GPT to get metadata
  const metadataExtractor = split[0];
  // book chapters
  const chapters = split.slice(1);

  const chapterObj = chapters.map((chapter, index) => ({
    chapterNumber: index + 1,
    content: chapter,
  }));

  return { metadataExtractor, chapterObj };
};
