import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DebugLens',
  description: 'DebugLens - Code Abstraction Tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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