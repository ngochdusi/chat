import { pool } from "./db"
import fs from "fs"
import path from "path"

export async function initDatabase() {
  const client = await pool.connect()
  try {
    const schemaPath = path.join(process.cwd(), "schema.sql")
    const schema = fs.readFileSync(schemaPath, "utf8")
    await client.query(schema)
    console.log("Database schema created successfully")
  } catch (error) {
    console.error("Error initializing database:", error)
  } finally {
    client.release()
  }
}

