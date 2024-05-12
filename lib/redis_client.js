import { kv } from "@vercel/kv";
import { createClient } from "redis";

export async function Get(key) {
  if (process.env.LOCAL === "1") {
    const client = await createClient()
      .on("error", (err) => console.log("Redis Client Error", err))
      .connect();
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
    const client = await createClient()
      .on("error", (err) => console.log("Redis Client Error", err))
      .connect();
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
