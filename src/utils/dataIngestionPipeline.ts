import { pipeline } from "@xenova/transformers";
import fs from "fs";
import { readFileSync } from "fs";
import { supabase } from "../config/db.js";
import { PDFParse } from "pdf-parse";
import { readFile } from "node:fs/promises";
import { LlamaParseReader } from "llama-cloud-services";

const generateEmbedding = await pipeline(
  "feature-extraction",
  "Supabase/gte-small"
);

interface bookMetadata {
  topic: string;
  title: string;
  chapters: number;
  author: string;
  year: number;
}

export const bookHandler = async (file_dir: string, metadata: bookMetadata) => {
  const { topic, title, chapters, author, year } = metadata;

  // upload book metadata and return id
  const bookId = await bookUpload(topic, title, chapters, author, year);

  //chop book and return chunks + embeddings
  const embeddings = await dataProcessor(file_dir);

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
        const textResult = await parser.getText();

        // data = {
        //   bookInfo: info,
        //   bookText: textResult
        // }

        await parser.destroy();
        data = textResult.text;
        break;
      case "txt":
        console.log("TXT");
        data = await fs.promises.readFile(file_dir, { encoding: "utf-8" });
        break;
    }

    // const reader = new LlamaParseReader({
    //     resultType: "markdown",
    //     apiKey: process.env.LLAMA_CLOUD_API_KEY,
    //   });

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
  chapters: number,
  author: string,
  year: number
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("books")
      .insert({
        title: title,
        author: author,
        chapters: chapters,
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
