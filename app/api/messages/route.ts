import { NextResponse } from "next/server"
import { getMessages } from "@/actions/chat-actions"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: Request) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const roomId = searchParams.get("roomId")

  if (!roomId) {
    return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
  }

  const messages = await getMessages(roomId)
  return NextResponse.json(messages)
}

