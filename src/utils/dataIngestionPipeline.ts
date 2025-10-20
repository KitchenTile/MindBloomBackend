import { pipeline } from "@xenova/transformers";
import fs from "fs";
import { readFileSync } from "fs";
import { supabase } from "../config/db.js";
import { PDFParse } from "pdf-parse";
import { readFile } from "node:fs/promises";
import { LlamaParseReader } from "llama-cloud-services";
import OpenAI from "openai";

const generateEmbedding = await pipeline(
  "feature-extraction",
  "Supabase/gte-small"
);

interface bookMetadata {
  topic: string;
  title: string;
  author: string;
  year: number;
}

export const bookHandler = async (file_dir: string) => {
  //chop book and return chunks + embeddings
  const embeddings = await dataProcessor(file_dir);
  // get the metadata from the gpt call
  // const { topic, title, author, year } = JSON.parse(
  //   await getGptMetadata(file_dir)
  // );
  const { topic, title, author, year } = await getGptMetadata(file_dir);

  // upload book metadata and return id
  const bookId = await bookUpload(topic, title, author, year);
  //upload chunks
  const data = await chunkUpload(bookId, embeddings);
  return data;
};

// first step of the injection pipeline - loading, chunking and embedding
const dataProcessor = async (
  file_dir: string
): Promise<{ content: string; embedding: number[] }[]> => {
  try {
    const fileExtension = getFileExtension(file_dir);
    let data;

    switch (fileExtension) {
      case "pdf":
        console.log("PDF");
        const buffer = await readFile(file_dir);
        const parser = new PDFParse({ data: buffer });
        // const textResult = await parser.getText();

        // data = {
        //   bookInfo: info,
        //   bookText: textResult
        // }

        const reader = new LlamaParseReader({
          resultType: "markdown",
          apiKey: process.env.LLAMA_CLOUD_API_KEY,
        });

        const documents = await reader.loadData(file_dir);

        // await parser.destroy();
        // data = textResult.text;
        data = documents;
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

    console.log(data);

    //split and filter empty spaces
    const chunks = data
      .split(/\r?\n\r?\n/)
      .filter((chunk) => chunk.trim().length > 0);

    const result = await Promise.all(
      chunks.map(async (chunk) => ({
        content: chunk,
        embedding: (
          await generateEmbedding(chunk, {
            pooling: "mean",
            normalize: true,
          })
        ).tolist() as number[],
      }))
    );

    return result;
  } catch (error) {
    console.log(error);
  }
};

//upsert and handle the chunks (insert or upload)
const chunkUpload = async (
  book_id: string,
  embeddings: { content: string; embedding: number[] }[]
) => {
  try {
    const bookId = book_id;
    const chunksToUpsert = embeddings.map(
      (e: { content: string; embedding: number[] }, index) => {
        const chunkObject = {
          book_id: bookId,
          chapter: 1,
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
  year: number
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("books")
      .insert({
        title: title,
        author: author,
        topic: topic,
        year: year,
      })
      .select("id");

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

    // //ask gpt for metadata
    // const gptReply = await client.chat.completions.create({
    //   model: "gpt-5",
    //   // text: { type: "json_schema" },
    //   response_format: { type: "json_object" },

    //   messages: [
    //     {
    //       role: "system",
    //       content: `
    //       You are an expert Librarian and Metadata Extractor. Your task is to analyze the provided text snippet, identify the full title and author of the book, and then use your knowledge and external search tools to find the required publication details.

    //       1. **Required Fields:** You MUST return a single JSON object with the following four keys.
    //         - "topic": (The book's topic from the following options: "Biology", "English", "Computer Science", "History")
    //         - "title": (The full book title as a string)
    //         - "author": (The full name of the author, as an array of strings)
    //         - "year": (The year of publication as a number)

    //       2. **Output Rule:** Your entire response MUST be valid JSON. DO NOT include any introductory or concluding text.
    //       `,
    //     },
    //     {
    //       role: "user",
    //       content: `pelase find the following book and its information ${textExtract}`,
    //     },
    //   ],
    // });
    // const bookMetadata = gptReply.choices[0].message.content;

    const bookMetadata = {
      topic: "Computer Science",
      title:
        "The Full-Stack Developer: Your Essential Guide to the Everyday Skills Expected of a Modern Full-Stack Web Developer",
      author: ["Chris Northwood"],
      year: 2018,
    };

    console.log(bookMetadata);

    return bookMetadata;
  } catch (error) {
    console.log(error);
  }
};

export const recursiveTextChunkSplitter = (
  text: string,
  chunkLength: number
) => {
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

  //base case where text length is smaller than the chunk length parameter
  if (text.length < chunkLength) {
    return [text];
  } else {
    let textPieces: string[] = [text];
    for (const separator of textSeparator) {
      if (text.includes(separator)) {
        textPieces = text.split(separator);
        break;
      }
    }
    return textPieces.flatMap((text) =>
      recursiveTextChunkSplitter(text, chunkLength)
    );
  }
};

const chapterSplitter = (data: string) => {
  //split data into chapters and return an array of chapters
  const split = data.split("### Chapter");

  // use this to feed GPT to get metadata
  const metadataExtractor = split[0];
  // book chapters
  const chapters = split.slice(1);

  const chapterObj = chapters.map((chapter, index) => [
    `${index + 1}`,
    chapter,
  ]);

  return { metadataExtractor, chapters };
};
