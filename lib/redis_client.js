import { kv } from "@vercel/kv";
import { createClient } from "redis";

async function connectToRedis() {
  let client;
  try {
    client = createClient();
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
    let client;
    try {
      client = await connectToRedis();
    } catch (err) {
      return null;
    }
    const value = await client.get(key);
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
    let client;
    try {
      client = await connectToRedis();
    } catch (err) {
      return;
    }
    if (value instanceof Object) {
      await client.set(key, JSON.stringify(value));
    } else {
      await client.set(key, value);
    }
  } else {
    await kv.set(key, value);
  }
  return;
}
