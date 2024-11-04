'use client'

export default function TestComponent() {
  return (
    <div className="p-4 bg-blue-200">
      The time is: {new Date().toISOString()}
    </div>
  )
}