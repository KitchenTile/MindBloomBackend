import { Request, Response } from "express";
import { handleUserQuery } from "../utils/queryRetrivalPipeline.js";
import OpenAI from "openai";
import { supabase } from "../config/db.js";
import { FunctionsFetchError } from "@supabase/supabase-js";
import { title } from "process";

export const handleChat = async (req: Request, res: Response) => {
  try {
    //init gpt client
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const userQuery = req.body.userQuery;
    const chatId = req.body.chatId;
    console.log("chatId");

    console.log(chatId);

    if (!userQuery) {
      return res.status(400).json({ message: "Query is required" });
    }

    //upload user message
    await uploadMessage(chatId, userQuery, "user");
    //get chat data
    const chatMessages = await fetchChat(chatId);

    let chatMessagesObj;

    chatMessages.map((message) => {
      for (const [key, value] of Object.entries(message)) {
        chatMessagesObj = value.map((msg) => {
          return {
            role: msg.role,
            content: msg.content,
          };
        });
      }
    });

    console.log(chatMessagesObj);
    // Format history for the LLM
    const historyMessages = chatMessages ? chatMessagesObj : [];

    console.log("history");

    console.log(historyMessages);

    //similarity search
    const relataedChunks = await handleUserQuery(userQuery);

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
        ...historyMessages,
        {
          role: "user",
          content: `${userQuery}`,
        },
      ],
    });

    const replyContent = gptReply.choices[0].message.content;

    console.log("REPLY");
    console.log(replyContent);

    await uploadMessage(chatId, replyContent, "assistant");

    return res.status(200).json(replyContent);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server error");
  }
};

export const getAllChats = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("chats").select();

    if (error) return error;

    console.log("CHATS");
    console.log(data);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
  }
};

const uploadMessage = async (chatId, message: string, role: string) => {
  let newChat = true;
  if (!chatId) {
    console.log("No chat ID");
  }

  //check if chatId exists in the database
  const currentChat = await fetchChat(chatId);

  if (currentChat.length !== 0) newChat = false;

  // create timestamp, and form the new message object
  const date = new Date(Date.now()).toISOString();
  const messageObj = { role: role, content: message, timestamp: date };

  if (newChat) {
    const { error } = await supabase.from("chats").insert({
      chat_id: chatId,
      title: chatId,
      user_id: chatId,
      messages: messageObj,
      created_at: date,
    });

    console.log("UPLOAD NEW MESSAGE");
    if (error) return error;
  } else {
    const { error } = await supabase.rpc("add_chat_message", {
      p_chat_id: chatId,
      p_new_message: messageObj,
    });

    console.log("UPDATE MESSAGFE ARRAY");
    if (error) return error;
  }
};

const fetchChat = async (chatId) => {
  const { data, error } = await supabase
    .from("chats")
    .select("messages")
    .eq("chat_id", chatId);

  if (error) return error;

  return data;
};
