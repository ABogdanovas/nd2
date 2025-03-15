import { MongoClient, Db } from "mongodb";
import "dotenv/config";

// const uri = "mongodb://localhost:27017/firstHomework"; // Local MongoDB
const uri =
  process.env.MONGODB_SERVER_URI ?? "mongodb://localhost:27017/firstHomework";
const client = new MongoClient(uri);

console.log(process.env.MONGODB_SERVER_URI);

let db: Db;

export const connectToMongo = async (): Promise<void> => {
  try {
    await client.connect();
    db = client.db();
    console.log("MongoDB connected");
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
  }
};

export const getDB = (): Db => {
  if (!db) {
    throw new Error("Database not initialized!");
  }
  return db;
};
