import { Pool } from "pg"

const connectionString =
  "postgresql://chat_owner:npg_oiDeZF5Jq3AU@ep-solitary-resonance-a5m1pfyk-pooler.us-east-2.aws.neon.tech/chat?sslmode=require"

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

async function testConnection() {
  try {
    // Test the connection
    const client = await pool.connect()
    console.log("Successfully connected to Neon PostgreSQL database!")

    // Check if our tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)

    console.log("Tables in database:")
    if (tablesResult.rows.length === 0) {
      console.log("No tables found. You need to run the init-db-neon.ts script first.")
    } else {
      tablesResult.rows.forEach((row) => {
        console.log(`- ${row.table_name}`)
      })
    }

    client.release()
  } catch (error) {
    console.error("Error connecting to the database:", error)
  } finally {
    // Close the pool
    await pool.end()
  }
}

testConnection()

