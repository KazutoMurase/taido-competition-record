import { Pool } from "pg";
import { db } from "@vercel/postgres";

export default async function GetClient() {
  if (process.env.LOCAL === "1") {
    const client = new Pool({
      user: process.env.PGSQL_USER,
      password: process.env.PGSQL_PASSWORD,
      host: process.env.PGSQL_HOST,
      port: process.env.PGSQL_PORT,
      database: process.env.PGSQL_DATABASE,
    });
    return client;
  } else {
    const client = await db.connect();
    return client;
  }
}
