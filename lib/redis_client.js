import { kv } from "@vercel/kv";
import { createClient } from "redis";

async function connectToRedis() {
  let client;
  try {
    client = createClient({ pingInterval: 10000 });
    client.on("error", (err) => {
      console.log("Redis Client Error", err);
      throw err;
    });
    await client.connect();
  } catch (err) {
    console.log("Connection Error", err);
    throw err;
  }
  return client;
}

export async function Get(key) {
  if (process.env.LOCAL === "1") {
    let value;
    try {
      const client = await connectToRedis();
      value = await client.get(key);
    } catch (err) {
      return null;
    }
    if (value instanceof Object) {
      return JSON.parse(value);
    } else if (typeof value === "string") {
      return JSON.parse(value);
    } else {
      return value;
    }
  } else {
    const value = await kv.get(key);
    return value;
  }
}

export async function Set(key, value) {
  if (process.env.LOCAL === "1") {
    try {
      const client = await connectToRedis();
      if (value instanceof Object) {
        await client.set(key, JSON.stringify(value));
      } else {
        await client.set(key, value);
      }
    } catch (err) {
      return;
    }
  } else {
    await kv.set(key, value);
  }
  return;
}
