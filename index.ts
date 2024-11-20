import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient("mongodb+srv://admin:12345@cluster0.qyb0v.mongodb.net/bun_db?retryWrites=true&w=majority&appName=Cluster0");
await client.connect();
console.log("Connected to MongoDB");

const db = client.db("bun_db");
const productsCollection = db.collection("products");

const server = Bun.serve({
  port: 3000,
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (path === "/" && method === "GET") {
      return new Response("Welcome to Bun!")
    }

    if (path === "/products" && method === "GET") {
      const products = await productsCollection.find().toArray();
      return new Response(JSON.stringify(products), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (path === "/products" && method === "POST") {
      const newProduct = await request.json();
      const result = await productsCollection.insertOne(newProduct);
      return new Response(JSON.stringify({ id: result.insertedId }), {
        headers: { "Content-Type": "application/json" },
        status: 201,
      });
    }

    if (path.startsWith("/products/") && method === "GET") {
      const id = path.split("/")[2];
      if (!ObjectId.isValid(id)) {
        return new Response(JSON.stringify({ error: "Invalid ID format" }), {
          headers: { "Content-Type": "application/json" },
          status: 400,
        });
      }
      const product = await productsCollection.findOne({ _id: new ObjectId(id) });
      if (!product) {
        return new Response(JSON.stringify({ error: "Product not found" }), {
          headers: { "Content-Type": "application/json" },
          status: 404,
        });
      }
      return new Response(JSON.stringify(product), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (path.startsWith("/products/") && method === "PUT") {
      const id = path.split("/")[2];
      const updates = await request.json();
      const result = await productsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updates }
      );
      if (result.matchedCount === 0) {
        return new Response(JSON.stringify({ error: "Product not found" }), {
          headers: { "Content-Type": "application/json" },
          status: 404,
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (path.startsWith("/products/") && method === "DELETE") {
      const id = path.split("/")[2];
      const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
        return new Response(JSON.stringify({ error: "Product not found" }), {
          headers: { "Content-Type": "application/json" },
          status: 404,
        });
      }
      return new Response(null, { status: 204 });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Listening on http://localhost:${server.port}`);
