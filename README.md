# Backend Documentation: Lesson Scheduling Platform and Educational RAG System


This document briefly explains the architectural design and functional specifications of the
Node.js (JavaScript/Express) backend application, which holds the purpose of both a lessons scheduling platform and a suplementary educational chatbot.

## Instalation

Despite the backend being hosted both on AWS and Render.com, the development environment can be installed and ran by
```
npm install
npm run dev
```

## Organization and structure

**Project Structure**

The main objective when it came to structure was to keep file organisation as a priority, following professional standards:
/controllers: Contains request handlers that process inputs and manage business logic.
/routes: Defines API endpoints.
/middleware: Contains functions in charge of processing logic and perform key tasks.
/utils: Mainly contains pipelines, specifically for RAG data ingestion and retrieval of information.


**Databases**
 Given the project developing the way it did, with the implementation of new features came the need to implement a vectored database. The databases were implemented as follows:
1. **MongoDB:** Manages main purpose of the app with the following collections:
		-- lessons : Stores detailed course information (topic, price, location, available spaces).
		-- orders : Records order history (lessonIds, user name, user phone number).
2. **Supabase (PostgreSQL with pgvector):**  User Management, Authorization, and Vector Storage for chatbot pipelines.



## Added Core Functionality: Educational Chatbot (RAG)

 After finishing the original project I decided to build and implement a RAG pipeline that potentially deals with information related to the lessons students can book. I thought this would be a nice learning opportunity that would pair nicely with the project.
 The following are notes I made throughout the development that explain particular note worthy areas of the project.

 **DOCUMENT FORMATTING:** For document formatting I had the choice of using a JS library or a service like llamaIndex. After going through a series of libraries decided to use client side powered library PDF2MD. The reason I use it is because it returns clear and relatively structured markdown text, making the task of separating each heading and book chapter significantly easier. An other reason to choose this library is that most other PDF handling libraries are either costly or have long conversion times.  
The way it will work is, an admin has access to an upload page where they are able to upload a document, if the document is PDF, the document will be converted on client side and will be sent as .md to the backend where it will be processed.
 (source: [https://javascript.plainenglish.io/this-little-known-pdf-parsing-library-will-save-enterprises-millions-66836f5f4c70](https://javascript.plainenglish.io/this-little-known-pdf-parsing-library-will-save-enterprises-millions-66836f5f4c70))

**DATA CHUNKING:** When it came to datachunking, the older version only divided text by a single separator, a double new line generally meaning the break of a paragraph. The improvement came in two steps for a full book

- serparating the full text into chapters: Our function **chapterSplitter** takes the whole text and returns an array of objects, each containing the chapter number and the chapter content, and a metadataExtractor string, which is everything before the first chapter. The first 1000/1500 characters of the metadataExtractor string will be used to get the necessary book metadata in the **getGptMetdata.**  
- the actual book chunking: Our function **recursiveTextChunkSplitter** takes in a string of text (each chapter) and a chunkLength, which will be the maximum amount of characters a chunk can have. We recursively go through the text passeed, break it into chunks with the use of separators and return an array of chunks attatched with it's corresponsing chapter.

 **DB QUERY:**  The db query improvements are realated to adding surrounding context. When building the prompt to the LLM, we send chunks of texts it uses to formulate the reply. The chunks are selected through similarity between the embedded question and all the embedded chunks. To help the LLM give a more informed response, we give it not only the pieces of information from the chunks it needs, but also the surounding chunks as context.
 
**CONTEXT AUGMENTATION:** Sometimes the core information the LLM needs to accurately answer the question at hand is not all in the chunk with the highest similarity. By providing context (chunk above and below), we make sure all relevant information is passed.

**METADATA AUGMENTATION:** Given how complicated effcient document formatting and how metadata is not guaranteed due to the unstructured nature of documents, I decided to try and get the metadata through a Chat GPT API call. The call will contain a certain amount of text chunks, generally the first couple (most of the times already containing some information we need), and will ask gpt to identify the book. Once it does, it can just give is important information like author, topic, year of publication, ISBN or whatever we need. This will decrese how much we rely on the file itself.

**MEMORY INTEGRATION:** Allowing the user to see different chats and potentially chat to different agents requires uploading all the conversations into our database. After that, we can fetch that information and feeding it to the LLM inside our prompt, allowing it to get context from the conversation history.


For detailed information about my rag + diagram visit the miro board I made: https://miro.com/app/board/uXjVJ76NHBM=/?share_link_id=330157566119
