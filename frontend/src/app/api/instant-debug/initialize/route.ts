import { NextResponse } from 'next/server';

const INSTANT_SYSTEM_PROMPT = `Generate an instant debugging walkthrough for the given scenario. Focus on providing immediate, useful feedback that can be progressively enhanced.

Response Format:
{
  "debugSession": {
    "id": "string - unique session ID",
    "overview": "string - 1-2 sentence summary",
    "steps": [
      {
        "id": "string - unique step ID",
        "name": "string - step name",
        "quickCode": ["array of 2-3 most essential code lines"],
        "quickConcept": "string - one-line concept explanation",
        "initialVariables": {
          "key": "initial value"
        }
      }
    ],
    "metadata": {
      "estimatedComplexity": "low|medium|high",
      "suggestedBreakpoints": ["array of step IDs"]
    }
  }
}

Requirements:
1. SPEED: Provide minimal but meaningful initial response
2. ESSENTIAL: Include only the most critical code lines
3. CLARITY: Each step must be immediately understandable
4. PROGRESSIVE: Enable smooth enhancement of details`;

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const response = await fetch(process.env.CLAUDE_API_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL,
        system: INSTANT_SYSTEM_PROMPT,
        messages: [{ 
          role: 'user',
          content: `Create an instant debug walkthrough for: ${prompt}. Focus on immediate, essential details that can be shown right away.`
        }],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const messageContent = data.content?.[0]?.text;
    
    if (!messageContent) {
      throw new Error('No content in API response');
    }

    // Extract JSON from response
    const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const debugSession = JSON.parse(jsonMatch[0]);

    return NextResponse.json(debugSession);
  } catch (error: any) {
    console.error('Error in instant-debug initialize:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize instant debug session' },
      { status: 500 }
    );
  }
} 