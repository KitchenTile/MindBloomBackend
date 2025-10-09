import { pipeline } from "@xenova/transformers";
import fs from "fs";
import { supabase } from "../config/db.js";

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

  //upload book and return id
  const bookId = await bookUpload(topic, title, chapters, author, year);

  //chop book and return chunks + embeddings
  const embeddings = await dataProcessor(file_dir);

  //upload chunks
  const data = chunkUpload(bookId, embeddings);

  return data;
};

// first step of the injection pipeline - loading, chunking and embedding
const dataProcessor = async (
  file_dir: string
): Promise<{ content: string; embedding: number[] }[]> => {
  try {
    const data = await fs.promises.readFile(file_dir, { encoding: "utf-8" });

    //split and filter empty spaces
    const chunks = data
      .split("\r\n")
      .filter((chunk) => (chunk === "" ? false : true));

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
      .upsert(chunksToUpsert, { onConflict: "book_id, chapter, chunk_order)" })
      .select();

    if (error) return error;

    return data;
  } catch (error) {
    console.log(error);
  }
};

// upload the book to the database
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
