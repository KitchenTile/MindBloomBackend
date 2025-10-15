import { Request, Response } from "express";
import { handleUserQuery } from "../utils/queryRetrivalPipeline.js";
import OpenAI from "openai";
import { supabase } from "../config/db.js";

export const handleChat = async (req: Request, res: Response) => {
  try {
    //init gpt client
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const userQuery = req.body.userQuery;

    if (!userQuery) {
      return res.status(400).json({ message: "Query is required" });
    }

    //similarity search
    const relataedChunks = await handleUserQuery(userQuery);

    // console.log("CONTROLLER");
    // console.log(relataedChunks);

    //Format the information returned in a way it's easily understood by the LLM, providing some metadata
    const chunkContentFormatted = relataedChunks
      .map(
        (chunk: any, index: number) =>
          `--- SOURCE ${index + 1} (Title: ${chunk.book_title}, Author: ${chunk.book_author}, Chapter ${chunk.chapter}) ---\n${chunk.chunk_content}\n`
      )
      .join("\n\n");

    console.log(chunkContentFormatted);

    console.log("CALL GPT REPLY");
    // shape the gpt promp
    const gptReply = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant. Use the following documents to answer the user's question, if you use differnet books for your answer, cite the book title, its author and the chapter of the book you used. If the answer is not contained in the documents, say "I don't have enough information to answer that question." Do not make up any information.
          Documents:
          ${chunkContentFormatted}`,
        },
        {
          role: "user",
          content: `${userQuery}`,
        },
      ],
    });

    const replyContent = gptReply.choices[0].message.content;

    console.log("reply");
    console.log(replyContent);

    return res.status(200).json(replyContent);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server error");
  }
};

// const uploadMessage = async (chatId, message: string) => {

//   const messageObj =   { "role": "user", "content": message, "timestamp": Date.now() }

//       const { error } = await supabase
//         .from("chats")
//         .update(message: message);

//       if (error) return error;

//     }
