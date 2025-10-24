import { pipeline } from "@xenova/transformers";
import { supabase } from "../config/db.js";

const generateEmbedding = await pipeline(
  "feature-extraction",
  "Supabase/gte-small"
);

//vectorize and match users question with added context
export const handleUserQuery = async (question) => {
  const embedding = await getQuestionEmbedding(question);

  //semantic search
  const chunks = await matchBookChunks(embedding);

  const addedContext = await getChunkNeighbours(chunks);

  // data from chunks + added context with metadata
  const result = addedContext.map((r) => r.data);

  return result[0];
};

//vectorize user's question
const getQuestionEmbedding = async (question) => {
  //supabase small has a 512 token limit. Could consider chunking lengthy questions
  const embeddedQuestion = (
    await generateEmbedding(question, {
      pooling: "mean",
      normalize: true,
    })
  ).tolist();

  return embeddedQuestion[0];
};

//match book chunks with users question
const matchBookChunks = async (embedding) => {
  const { data, error } = await supabase.rpc("match_book_chunks", {
    query_embedding: embedding,
    match_threshold: 0.78,
    match_count: 10,
  });

  if (error) return error;

  return data;
};

//function that gets the match book chunks and gets their neighbours to get more context
const getChunkNeighbours = async (chunks) => {
  //  Group by Book ID to then do it by chapter
  const bookGroups = Object.groupBy(chunks, ({ book_id }) => book_id);

  //collection of promises that ends up in a db call for the book
  const allBookPromises = Object.entries(bookGroups).map(
    ([bookIdKey, bookChunks]) => {
      const chapterGroups = Object.groupBy(
        bookChunks,
        ({ chapter }) => chapter
      );

      // map over the Chapter Groups to create the database call promises
      const allChapterPromises = Object.entries(chapterGroups).map(
        ([chapterKey, chapterChunks]) => {
          const chunkOrders = chapterChunks.map((chunk) => chunk.chunk_order);

          // this is the individual database promise for a single {book, chapter} group
          return supabase.rpc("get_context_neighbors", {
            p_book_id: bookIdKey,
            p_chapter: chapterChunks[0].chapter,
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
