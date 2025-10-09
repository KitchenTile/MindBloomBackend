import { Request, Response } from "express";
import { handleUserQuery } from "../utils/userDataRetrival.js";
import OpenAI from "openai";

export const handleChat = async (req: Request, res: Response) => {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const userQuery = req.body.userQuery;

    console.log(userQuery);

    const relataedChunks = await handleUserQuery(userQuery);

    const chunkContent = relataedChunks.map((chunk) => chunk.chunk_content);

    const gptReply = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Please only use the following information: ${chunkContent}.`,
        },
        {
          role: "user",
          content: `${userQuery}`,
        },
      ],
    });

    const replyContent = gptReply.choices[0].message.content;

    return res.status(201).json(replyContent);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server error");
  }
};
