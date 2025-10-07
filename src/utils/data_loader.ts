import { pipeline } from "@xenova/transformers";
import fs from "fs";

const generateEmbedding = await pipeline(
  "feature-extraction",
  "Supabase/gte-small"
);

const data_loader = async (file_dir: string) => {
  let chunks = [];
  fs.readFile(file_dir, { encoding: "utf-8" }, function (err, data) {
    if (!err) {
      chunks = data.split("\n\n");
    } else {
      console.log(err);
    }
  });

  const embeddings = Promise.all(
    chunks.map((chunk) => {
      return await generateEmbedding(chunk, {
        pooling: "mean",

        normalize: true,
      });
    })
  );
};
