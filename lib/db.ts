import { Pool } from "pg"

// Thay đổi dòng khai báo connectionString thành:
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://chat_owner:npg_oiDeZF5Jq3AU@ep-solitary-resonance-a5m1pfyk-pooler.us-east-2.aws.neon.tech/chat?sslmode=require"

// Đảm bảo SSL được bật cho Neon
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log("Executed query", { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error("Query error:", error)
    throw error
  }
}

export { pool }

