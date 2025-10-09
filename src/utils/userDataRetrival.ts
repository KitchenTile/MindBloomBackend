import { pipeline } from "@xenova/transformers";
import { supabase } from "../config/db.js";

const generateEmbedding = await pipeline(
  "feature-extraction",
  "Supabase/gte-small"
);

export const getQuestionEmbedding = async (question: string) => {
  //supabase small has a 512 token limit. Could consider chunking lengthy questions
  const embeddedQuestion = await generateEmbedding(question, {
    pooling: "mean",
    normalize: true,
  });
  return embeddedQuestion;
};
