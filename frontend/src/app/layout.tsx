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
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <header className="bg-white shadow-sm">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold text-gray-900">DebugLens</h1>
            </div>
          </header>
          <main className="flex-1 container mx-auto px-4 py-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
} 