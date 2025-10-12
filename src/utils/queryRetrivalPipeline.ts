import { pipeline } from "@xenova/transformers";
import { supabase } from "../config/db.js";

const generateEmbedding = await pipeline(
  "feature-extraction",
  "Supabase/gte-small"
);

//vectorize and match users question
export const handleUserQuery = async (question: string) => {
  const embedding = await getQuestionEmbedding(question);

  // console.log("question embedding");
  // console.log(embedding);

  const result = await matchBookChunks(embedding);

  console.log("Match result");
  console.log(result)

  return result;
};

//vectorize user's question
export const getQuestionEmbedding = async (
  question: string
): Promise<number[]> => {
  //supabase small has a 512 token limit. Could consider chunking lengthy questions
  const embeddedQuestion = (
    await generateEmbedding(question, {
      pooling: "mean",
      normalize: true,
    })
  ).tolist() as number[][];

  return embeddedQuestion[0];
};

//match book chunks with users question
const matchBookChunks = async (embedding: number[]) => {
  const { data, error } = await supabase.rpc("match_book_chunks", {
    query_embedding: embedding,
    match_threshold: 0.78,
    match_count: 10,
  });

  if (error) return error;

  return data;
};
