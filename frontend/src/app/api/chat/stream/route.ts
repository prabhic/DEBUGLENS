import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    const response = await fetch(process.env.CLAUDE_API_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1000,
        stream: true, // Enable streaming
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Ensure the response is actually a streaming response
    if (!response.body) {
      throw new Error('No response body received');
    }

    // Set up streaming response headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Create stream transformer
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        try {
          const text = new TextDecoder().decode(chunk);
          // Parse the streaming response according to Claude's format
          const lines = text.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                controller.terminate();
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.delta?.text || parsed.content?.[0]?.text || '';
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          }
        } catch (error) {
          console.error('Error processing chunk:', error);
          controller.error(error);
        }
      }
    });

    return new Response(response.body.pipeThrough(transformStream), { headers });

  } catch (error) {
    console.error('Error in streaming chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process streaming request' },
      { status: 500 }
    );
  }
} 