import { MongoClient } from "mongodb";
import { startStandaloneServer } from "@apollo/server/standalone";
import { schema } from "./schema.ts";
import { ApolloServer } from "@apollo/server";
import { resolvers } from "./resolvers.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");

if (!MONGO_URL) {
  throw new Error("Please provide a MONGO_URL");
}

const client = new MongoClient(MONGO_URL);
await client.connect();

console.info("Mongo connected");

const db = client.db("agendaa");
const ContactCollection = db.collection("Contacto");

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  context: async () => ({ ContactCollection }),
});

console.info(`Server started at ${url}`);
