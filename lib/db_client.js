import { Pool } from "pg";

let client;

function connectToDb() {
  if (!client) {
    client = new Pool({
      user: process.env.PGSQL_USER,
      password: process.env.PGSQL_PASSWORD,
      host: process.env.PGSQL_HOST,
      port: process.env.PGSQL_PORT,
      database: process.env.PGSQL_DATABASE,
    });
  }
  return client;
}

export default function GetClient() {
  const client = connectToDb();
  return client;
}
