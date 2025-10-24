import { handleUserQuery } from "../utils/queryRetrivalPipeline.js";
import OpenAI from "openai";
import { supabase } from "../config/db.js";

export const handleChat = async (req, res) => {
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
    const chatData = await fetchChat(chatId);

    // chatData is a ChatRow object and we extract the messages array
    const rawHistory = chatData?.messages || [];

    // We only pass role/content to the LLM
    const historyMessages = rawHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    //similarity search
    const relataedChunks = await handleUserQuery(userQuery);

    //Format the information returned in a way it's easily understood by the LLM, providing some metadata
    const chunkContentFormatted = relataedChunks
      .map(
        (chunk, index) =>
          `--- SOURCE ${index + 1} (Title: ${chunk.book_title}, Author: ${chunk.book_author}, Chapter ${chunk.chapter}) ---\n${chunk.chunk_content}\n`
      )
      .join("\n\n");

    console.log(chunkContentFormatted);

    console.log("- CALL GPT REPLY -");
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

    console.log("- REPLY -");
    console.log(replyContent);

    await uploadMessage(chatId, replyContent, "assistant");

    return res.status(200).json(replyContent);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server error");
  }
};

export const getAllChats = async (req, res) => {
  try {
    const { data, error } = await supabase.from("chats").select();

    if (error) return error;
    console.log(data);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
  }
};

export const deleteChat = async (req, res) => {
  try {
    const chatId = req.body.chatId;
    const { data, error } = await supabase
      .from("chats")
      .delete()
      .eq("chat_id", chatId);

    if (error) return error;
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
  }
};

export const editChatTitle = async (req, res) => {
  try {
    const chatId = req.body.chatId;
    const newTitle = req.body.newTitle;

    const { data, error } = await supabase
      .from("chats")
      .update({ title: newTitle })
      .eq("chat_id", chatId);

    if (error) return error;
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
  }
};

// helper functions

const uploadMessage = async (chatId, message, role) => {
  if (!chatId) {
    console.log("No chat ID");
  }

  // create timestamp, and form the new message object
  const date = new Date(Date.now()).toISOString();
  const messageObj = { role: role, content: message, timestamp: date };

  //check if chatId exists in the database
  const currentChat = await fetchChat(chatId);

  if (!currentChat) {
    const { error } = await supabase.from("chats").insert({
      chat_id: chatId,
      title: "New Chat",
      user_id: chatId,
      messages: [messageObj],
      created_at: date,
    });

    if (error) throw error;
  } else {
    const { error } = await supabase.rpc("add_chat_message", {
      p_chat_id: chatId,
      p_new_message: messageObj,
    });

    if (error) throw error;
  }
};

const fetchChat = async (chatId) => {
  const { data, error } = await supabase
    .from("chats")
    .select("messages")
    .eq("chat_id", chatId)
    .single();
  if (error && error.code !== "PGRST116") {
    console.error("Supabase fetchChat error:", error);
    throw error;
  }
  return data;
};
