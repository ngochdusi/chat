import { pool } from "../lib/db"

async function initDatabase() {
  const client = await pool.connect()
  try {
    // SQL for creating tables
    const sql = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE
    );

    -- User profiles table
    CREATE TABLE IF NOT EXISTS user_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(100),
        bio TEXT,
        avatar_url VARCHAR(255),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Sessions table
    CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Chat rooms table
    CREATE TABLE IF NOT EXISTS chat_rooms (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Messages table
    CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- User-Room relationship (for tracking which users are in which rooms)
    CREATE TABLE IF NOT EXISTS user_rooms (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, room_id)
    );

    -- Indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
    CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_user_rooms_room_id ON user_rooms(room_id);
    
    -- Create a default chat room
    INSERT INTO chat_rooms (id, name, description, created_by)
    SELECT 
      uuid_generate_v4(), 
      'General', 
      'General chat room for everyone', 
      (SELECT id FROM users LIMIT 1)
    WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = 'General');
    `

    await client.query(sql)
    console.log("Database tables created successfully!")
  } catch (error) {
    console.error("Error initializing database:", error)
    throw error
  } finally {
    client.release()
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log("Database initialization complete")
      process.exit(0)
    })
    .catch((err) => {
      console.error("Database initialization failed:", err)
      process.exit(1)
    })
}

export { initDatabase }

