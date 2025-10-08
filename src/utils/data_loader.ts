import { pipeline } from "@xenova/transformers";
import fs from "fs";

const generateEmbedding = await pipeline(
  "feature-extraction",
  "Supabase/gte-small"
);

// first step of the injection pipeline - loading, chunking and embedding
export const data_loader = async (file_dir: string) => {
  try {
    const data = await fs.promises.readFile(file_dir, { encoding: "utf-8" });
    const chunks = data.split("\n\n");

    const embeddings = await Promise.all(
      chunks.map(async (chunk) => {
        return generateEmbedding(chunk, {
          pooling: "mean",
          normalize: true,
        });
      })
    );
    return embeddings;
  } catch (error) {
    console.log(error);
  }
};
