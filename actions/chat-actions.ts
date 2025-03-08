"use server"

import { v4 as uuidv4 } from "uuid"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function sendMessage(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const content = formData.get("message") as string
  const roomId = formData.get("roomId") as string

  if (!content || content.trim() === "") {
    return { error: "Message cannot be empty" }
  }

  if (!roomId) {
    return { error: "Room ID is required" }
  }

  try {
    const messageId = uuidv4()
    await query("INSERT INTO messages (id, room_id, user_id, content) VALUES ($1, $2, $3, $4)", [
      messageId,
      roomId,
      user.id,
      content,
    ])

    return { success: true }
  } catch (error) {
    console.error("Error sending message:", error)
    return { error: "Failed to send message" }
  }
}

export async function getMessages(roomId: string) {
  try {
    const result = await query(
      `
      SELECT m.id, m.content, m.created_at, m.user_id, u.username
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = $1
      ORDER BY m.created_at ASC
    `,
      [roomId],
    )

    return result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      userId: row.user_id,
      userName: row.username,
      timestamp: row.created_at,
    }))
  } catch (error) {
    console.error("Error getting messages:", error)
    return []
  }
}

export async function getChatRooms() {
  try {
    const result = await query(`
      SELECT id, name, description, created_at
      FROM chat_rooms
      ORDER BY created_at ASC
    `)

    return result.rows
  } catch (error) {
    console.error("Error getting chat rooms:", error)
    return []
  }
}

export async function createChatRoom(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || ""

  if (!name || name.trim() === "") {
    return { error: "Room name is required" }
  }

  try {
    const roomId = uuidv4()
    await query("INSERT INTO chat_rooms (id, name, description, created_by) VALUES ($1, $2, $3, $4)", [
      roomId,
      name,
      description,
      user.id,
    ])

    return { success: true, roomId }
  } catch (error) {
    console.error("Error creating chat room:", error)
    return { error: "Failed to create chat room" }
  }
}

export async function joinChatRoom(roomId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Check if user is already in the room
    const existingMembership = await query("SELECT 1 FROM user_rooms WHERE user_id = $1 AND room_id = $2", [
      user.id,
      roomId,
    ])

    if (existingMembership.rows.length === 0) {
      await query("INSERT INTO user_rooms (user_id, room_id) VALUES ($1, $2)", [user.id, roomId])
    }

    return { success: true }
  } catch (error) {
    console.error("Error joining chat room:", error)
    return { error: "Failed to join chat room" }
  }
}

