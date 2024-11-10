import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const response = await fetch(process.env.CLAUDE_API_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL,
        messages: [
          { 
            role: 'user', 
            content: `Generate a Gherkin feature file for: ${prompt}. 
                     The file should follow this structure:
                     
                     Feature: [Feature Name]
                     Description: [Feature Description]
                     
                     Scenario: [Scenario Name]
                     Description: [Scenario Description]
                     Given [initial context]
                     When [action is taken]
                     Then [expected outcome]
                     
                     Include detailed steps and multiple scenarios that cover different aspects of ${prompt}.
                     Use technical language and be specific about the implementation details.` 
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ content: data.content[0].text });
  } catch (error) {
    console.error('Error generating Gherkin file:', error);
    return NextResponse.json(
      { error: 'Failed to generate Gherkin file' },
      { status: 500 }
    );
  }
} 