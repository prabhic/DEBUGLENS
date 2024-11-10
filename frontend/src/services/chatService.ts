import { ChatMessage } from '@/types/chat';

interface ChatResponse {
  message: string;
}

export async function sendMessage(content: string, streaming = false) {
  if (!streaming) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: content }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    return response.json();
  }

  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: content }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.body;
} 