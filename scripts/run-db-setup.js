import { Pool } from "pg"

// Database connection
const pool = new Pool({
  connectionString: "postgresql://postgres:a@localhost:5432/mydatabase",
})

async function setupDatabase() {
  const client = await pool.connect()
  try {
    console.log("Setting up database tables...")

    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    console.log("UUID extension enabled")

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE
      )
    `)
    console.log("Users table created")

    // Create user_profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(100),
        bio TEXT,
        avatar_url VARCHAR(255),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("User profiles table created")

    // Create sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Sessions table created")

    // Create chat_rooms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Chat rooms table created")

    // Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Messages table created")

    // Create user_rooms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_rooms (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, room_id)
      )
    `)
    console.log("User rooms table created")

    // Create indexes
    await client.query("CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id)")
    await client.query("CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)")
    await client.query("CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)")
    await client.query("CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)")
    await client.query("CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)")
    await client.query("CREATE INDEX IF NOT EXISTS idx_user_rooms_room_id ON user_rooms(room_id)")
    console.log("Indexes created")

    console.log("Database setup completed successfully!")
  } catch (error) {
    console.error("Error setting up database:", error)
  } finally {
    client.release()
    await pool.end()
  }
}

setupDatabase()

