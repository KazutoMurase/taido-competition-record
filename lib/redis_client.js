import { kv } from "@vercel/kv";
import { createClient } from "redis";

let client;

async function connectToRedis() {
  if (!client) {
    try {
      client = createClient({
        url: "redis://" + process.env.REDISHOST + ":" + process.env.REDISPORT,
        pingInterval: 10000,
      });
      client.on("error", (err) => {
        console.log("Redis Client Error", err);
        client = null;
      });
      await client.connect();
    } catch (err) {
      console.log("Connection Error", err);
      throw err;
    }
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

export async function FlushAll() {
  if (process.env.LOCAL === "1") {
    try {
      const client = await connectToRedis();
      await client.flushAll();
    } catch (err) {
      return;
    }
  } else {
    await kv.flushAll();
  }
  console.log("succeeded in reset cache");
}
