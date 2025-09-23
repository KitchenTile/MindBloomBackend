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

let db;

export async function connectDB() {
  if (db) return db;

  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    db = client.db("MindBloom");
    // Send a ping to confirm a successful connection
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    console.log(db);

    return db;
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
