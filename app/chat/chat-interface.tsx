"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { sendMessage, createChatRoom, joinChatRoom } from "@/actions/chat-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Message = {
  id: string
  content: string
  userId: string
  userName: string
  timestamp: Date
}

type Room = {
  id: string
  name: string
  description: string
  created_at: Date
}

type User = {
  id: string
  username: string
  email: string
  full_name?: string
  avatar_url?: string
}

export default function ChatInterface({
  initialRooms,
  defaultRoomId,
  currentUser,
}: {
  initialRooms: Room[]
  defaultRoomId: string
  currentUser: User
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [currentRoomId, setCurrentRoomId] = useState<string>(defaultRoomId)
  const [inputValue, setInputValue] = useState("")
  const [showNewRoomForm, setShowNewRoomForm] = useState(false)
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomDescription, setNewRoomDescription] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load messages when room changes
  useEffect(() => {
    loadMessages()
    // Join the room
    joinChatRoom(currentRoomId)
  }, [currentRoomId])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(loadMessages, 3000)
    return () => clearInterval(interval)
  }, [currentRoomId])

  async function loadMessages() {
    try {
      const response = await fetch(`/api/messages?roomId=${currentRoomId}`)
      if (!response.ok) throw new Error("Failed to fetch messages")
      const newMessages = await response.json()
      setMessages(newMessages)
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const formData = new FormData()
    formData.append("message", inputValue)
    formData.append("roomId", currentRoomId)

    // Optimistically add message to UI
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      userId: currentUser.id,
      userName: currentUser.username,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setInputValue("")

    // Send message to server
    await sendMessage(formData)
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim()) return

    const formData = new FormData()
    formData.append("name", newRoomName)
    formData.append("description", newRoomDescription)

    const result = await createChatRoom(formData)
    if (result.success && result.roomId) {
      // Add new room to the list
      const newRoom: Room = {
        id: result.roomId,
        name: newRoomName,
        description: newRoomDescription,
        created_at: new Date(),
      }

      setRooms((prev) => [...prev, newRoom])
      setCurrentRoomId(result.roomId)
      setShowNewRoomForm(false)
      setNewRoomName("")
      setNewRoomDescription("")
    }
  }

  const currentRoom = rooms.find((room) => room.id === currentRoomId)

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar with rooms */}
      <div className="w-1/4 flex flex-col">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Chat Rooms</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="space-y-2 mb-4">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setCurrentRoomId(room.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    currentRoomId === room.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  {room.name}
                </button>
              ))}
            </div>

            {showNewRoomForm ? (
              <form onSubmit={handleCreateRoom} className="space-y-2">
                <Input
                  placeholder="Room name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  required
                />
                <Input
                  placeholder="Description (optional)"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    Create
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowNewRoomForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button onClick={() => setShowNewRoomForm(true)} variant="outline">
                New Room
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">{currentRoom?.name || "Chat"}</CardTitle>
            {currentRoom?.description && <p className="text-sm text-muted-foreground">{currentRoom.description}</p>}
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.userId === currentUser.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.userId === currentUser.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {message.userId !== currentUser.id && (
                      <div className="font-semibold text-xs mb-1">{message.userName}</div>
                    )}
                    <p>{message.content}</p>
                    <div className="text-xs opacity-70 text-right mt-1">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit">Send</Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}

