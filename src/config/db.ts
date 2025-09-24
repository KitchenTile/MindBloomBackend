import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGO_URI!;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db: any;

export async function connectDB() {
  if (db) return db;

  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    db = client.db("MindBloom");
    console.log("DB connected");
    return db;
  } catch (error) {
    console.log(error);
  }
}
