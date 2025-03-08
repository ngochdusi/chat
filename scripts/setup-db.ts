import { initDatabase } from "./init-db"

async function setupDatabase() {
  try {
    console.log("Starting database setup...")
    await initDatabase()
    console.log("Database setup completed successfully!")
  } catch (error) {
    console.error("Database setup failed:", error)
  }
}

setupDatabase()

