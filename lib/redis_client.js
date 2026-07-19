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
}

export async function GetMany(keys) {
  let values;
  try {
    const client = await connectToRedis();
    values = await client.mGet(keys);
  } catch (err) {
    return keys.map(() => null);
  }
  return values.map((value) =>
    typeof value === "string" ? JSON.parse(value) : value,
  );
}

export async function Set(key, value) {
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
  return;
}

export async function Increment(key) {
  try {
    const client = await connectToRedis();
    return await client.incr(key);
  } catch (err) {
    return null;
  }
}

export async function FlushAll() {
  try {
    const client = await connectToRedis();
    await client.flushAll();
  } catch (err) {
    return;
  }
  console.log("succeeded in reset cache");
}
