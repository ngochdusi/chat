import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { logout } from "@/actions/auth-actions"
import { getChatRooms } from "@/actions/chat-actions"
import { Button } from "@/components/ui/button"
import ChatInterface from "./chat-interface"

export default async function ChatPage() {
  const user = await requireAuth()
  const rooms = await getChatRooms()

  // If no rooms exist, create a default one
  if (rooms.length === 0) {
    redirect("/chat/create-room")
  }

  // Default to the first room
  const defaultRoomId = rooms[0].id

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b p-4 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Chat App</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">Welcome, {user.username}</span>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden container mx-auto p-4">
        <ChatInterface initialRooms={rooms} defaultRoomId={defaultRoomId} currentUser={user} />
      </main>
    </div>
  )
}

