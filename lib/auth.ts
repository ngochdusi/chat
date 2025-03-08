import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { query } from "./db"

export async function getCurrentUser() {
  const cookieStore = cookies()
  const token = cookieStore.get("session-token")?.value

  if (!token) {
    return null
  }

  try {
    // Get session and check if it's expired
    const sessionResult = await query("SELECT user_id, expires_at FROM sessions WHERE token = $1", [token])

    if (sessionResult.rows.length === 0 || new Date(sessionResult.rows[0].expires_at) < new Date()) {
      return null
    }

    // Get user
    const userId = sessionResult.rows[0].user_id
    const userResult = await query(
      "SELECT u.id, u.username, u.email, up.full_name, up.avatar_url FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.id = $1",
      [userId],
    )

    if (userResult.rows.length === 0) {
      return null
    }

    return userResult.rows[0]
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

