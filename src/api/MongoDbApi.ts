import { MongoClient, ObjectId } from "mongodb";
import { Json } from "../models/Json";
import { generateKey } from "../utils/key";

const uri = process.env.MONGODB_URI;

if (!uri) console.error('No MONGODB_URI found in .env file');

const client = new MongoClient(uri || '');

// Connect to the MongoDB server
async function connect() {
  try {
    await client.connect();
    console.log('Connected to the database');
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}
connect();

const DB_NAME = 'airlum';

export const create = async (obj: Json, collectionName: string, dbName = DB_NAME) => {
  const db = client.db(dbName);
  const collection = db.collection(collectionName)
  let result = null;
  try {
    result = await collection.insertOne(obj);
    console.log('Successfully inserted into the database');
  } catch (error) {
    console.error('Error inserting into the database:', error);
  }
  return result;
};

export const read = async (key: string, collectionName: string, dbName = DB_NAME) => {
  const db = client.db(dbName);
  const collection = db.collection(collectionName)
  let result = null;
  try {
    result = await collection.findOne({ _id: new ObjectId(key)});
  } catch (error) {
    console.error('Error reading from the database:', error);
  }
};

export const update = async (key: string, obj: Json, collectionName: string, dbName = DB_NAME) => {
  const db = client.db(dbName);
  const collection = db.collection(collectionName)
  let result = null;
  try {
    result = await collection.updateOne({ _id: new ObjectId(key)}, { $set: obj });
    console.log('Successfully updated the database');
  } catch (error) {
    console.error('Error updating the database:', error);
  }
};

export const remove = async (key: string, collectionName: string, dbName = DB_NAME) => {
  const db = client.db(dbName);
  const collection = db.collection(collectionName)
  let result = null;
  try {
    result = await collection.deleteOne({ _id: new ObjectId(key)});
    console.log('Successfully deleted from the database');
  } catch (error) {
    console.error('Error deleting from the database:', error);
  }
}