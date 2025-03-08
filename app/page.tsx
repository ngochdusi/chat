import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default function HomePage() {
  const user = getCurrentUser()

  if (user) {
    redirect("/chat")
  } else {
    redirect("/login")
  }
}

