"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function register(formData: FormData) {
  const username = formData.get("username") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!username || !email || !password) {
    return { error: "All fields are required" }
  }

  try {
    // Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1 OR username = $2", [email, username])

    if (existingUser.rows.length > 0) {
      return { error: "User already exists" }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const userId = uuidv4()
    await query("INSERT INTO users (id, username, email, password_hash) VALUES ($1, $2, $3, $4)", [
      userId,
      username,
      email,
      hashedPassword,
    ])

    // Create session
    const sessionId = uuidv4()
    const token = uuidv4()
    const expires = new Date()
    expires.setDate(expires.getDate() + 7) // 7 days from now

    await query("INSERT INTO sessions (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)", [
      sessionId,
      userId,
      token,
      expires,
    ])

    // Set cookie
    cookies().set({
      name: "session-token",
      value: token,
      httpOnly: true,
      path: "/",
      expires,
      sameSite: "lax",
    })

    // Create a default chat room if none exists
    const roomsResult = await query("SELECT id FROM chat_rooms LIMIT 1")
    if (roomsResult.rows.length === 0) {
      const roomId = uuidv4()
      await query("INSERT INTO chat_rooms (id, name, description, created_by) VALUES ($1, $2, $3, $4)", [
        roomId,
        "General",
        "General chat room for everyone",
        userId,
      ])
    }

    redirect("/chat")
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Failed to register. Please try again." }
  }
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  try {
    // Find user
    const userResult = await query("SELECT id, password_hash FROM users WHERE email = $1", [email])

    if (userResult.rows.length === 0) {
      return { error: "Invalid email or password" }
    }

    // Verify password
    const user = userResult.rows[0]
    const passwordMatch = await comparePasswords(password, user.password_hash)

    if (!passwordMatch) {
      return { error: "Invalid email or password" }
    }

    // Create session
    const sessionId = uuidv4()
    const token = uuidv4()
    const expires = new Date()
    expires.setDate(expires.getDate() + 7) // 7 days from now

    await query("INSERT INTO sessions (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)", [
      sessionId,
      user.id,
      token,
      expires,
    ])

    // Update last login
    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id])

    // Set cookie
    cookies().set({
      name: "session-token",
      value: token,
      httpOnly: true,
      path: "/",
      expires,
      sameSite: "lax",
    })

    redirect("/chat")
  } catch (error) {
    console.error("Login error:", error)
    return { error: "Failed to login. Please try again." }
  }
}

export async function logout() {
  const cookieStore = cookies()
  const token = cookieStore.get("session-token")?.value

  if (token) {
    try {
      await query("DELETE FROM sessions WHERE token = $1", [token])
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  cookies().delete("session-token")
  redirect("/login")
}

