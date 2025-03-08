import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { createChatRoom } from "@/actions/chat-actions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function CreateRoomPage() {
  const user = await requireAuth()

  async function handleCreateRoom(formData: FormData) {
    "use server"

    const result = await createChatRoom(formData)
    if (result.success && result.roomId) {
      redirect(`/chat`)
    }

    return result
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create a Chat Room</CardTitle>
          <CardDescription>Create a new room to start chatting</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleCreateRoom} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Room Name
              </label>
              <Input id="name" name="name" placeholder="General Discussion" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Input id="description" name="description" placeholder="A place to chat about anything" />
            </div>
            <Button type="submit" className="w-full">
              Create Room
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-center w-full">
            <Link href="/chat" className="text-primary hover:underline">
              Back to Chat
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

