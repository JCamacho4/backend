import { MongoClient } from "mongodb";
import 'dotenv/config';

const connectionString = process.env.CONNECTION_STRING;
// He usado .env por seguridad, pero dejo la URI de conexión aquí por si fuera necesario para la corrección
// CONNECTION_STRING="mongodb+srv://ingweb:ingweb@clusteringweb.ojhyruz.mongodb.net/?retryWrites=true&w=majority"

const client = new MongoClient(connectionString);

let conn;

try {
  conn = await client.connect();
} catch (e) {
  console.error(e);
}

let db = conn.db("examen2");

export default db;