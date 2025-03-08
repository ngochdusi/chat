import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { initDatabase } from "@/lib/init-db"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Chat App",
  description: "A simple chat application with authentication",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize the database on app start
  initDatabase().catch(console.error)
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">{children}</div>
      </body>
    </html>
  )
}



import './globals.css'