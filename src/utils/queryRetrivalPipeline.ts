import { pipeline } from "@xenova/transformers";
import { supabase } from "../config/db.js";

const generateEmbedding = await pipeline(
  "feature-extraction",
  "Supabase/gte-small"
);

interface finalChunk {
  chunk_id: number;
  book_id: number;
  chapter: number;
  chunk_content: string;
  embedding: number[];
  chunk_order: number;
  similarity: number;
  book_title: string;
  book_author: string;
}

//vectorize and match users question
export const handleUserQuery = async (question: string) => {
  const embedding = await getQuestionEmbedding(question);

  // console.log("question embedding");
  // console.log(embedding);

  const chunks = await matchBookChunks(embedding);

  const addedContext = await getChunkNeighbours(chunks);

  const result = {
    chunks: chunks,
    addedContext: addedContext.map((r) => r.data),
  };

  console.log(result.addedContext);

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

//function that gets the match book chunks and gets their neighbours to get more context
const getChunkNeighbours = async (chunks: finalChunk[]) => {
  //  Group by Book ID to then do it by chapter
  const bookGroups = Object.groupBy(chunks, ({ book_id }) => book_id);

  //collection of promises that ends up in a db call for the book
  const allBookPromises = Object.entries(bookGroups).map(
    ([bookIdKey, bookChunks]) => {
      const chapterGroups = Object.groupBy(
        bookChunks as finalChunk[],
        ({ chapter }) => chapter
      );

      // map over the Chapter Groups to create the database call promises
      const allChapterPromises = Object.entries(chapterGroups).map(
        ([chapterKey, chapterChunks]) => {
          const chunkOrders = chapterChunks!.map(
            (chunk: finalChunk) => chunk.chunk_order
          );

          // this is the individual database promise for a single {book, chapter} group
          return supabase.rpc("get_context_neighbors", {
            p_book_id: bookIdKey,
            p_chapter: chapterChunks![0].chapter,
            p_chunk_orders: chunkOrders,
          });
        }
      );

      return Promise.all(allChapterPromises);
    }
  );

  //Await all promises from all books and chapters concurrently
  const resolvedContexts = await Promise.all(allBookPromises);

  // Flatten the results into a single list of context chunks
  const finalContexts = resolvedContexts.flat();

  return finalContexts;
};
