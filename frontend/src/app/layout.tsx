import type { Metadata } from 'next'
import './globals.css'
import { AIChatDialog } from '@/components/Chat/AIChatDialog'
import { useState } from 'react'

export const metadata: Metadata = {
  title: 'DebugLens',
  description: 'DebugLens - Code Abstraction Tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Note: Since this is a server component, we'll need to move the AI chat state management
  // to a client component wrapper or use a more sophisticated state management solution
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-100">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
} 