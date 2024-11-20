import { NextResponse } from 'next/server';

const STEP_DETAILS_PROMPT = `Analyze how the data structures change during this implementation step. Focus ONLY on:
1. Data structure state BEFORE this step
2. Data structure state AFTER this step
3. Key changes that occurred

Response Format:
{
  "stepDetails": {
    "dataStructures": {
      "before": {
        "name": "string - Structure name",
        "state": "string - Initial state representation",
        "values": ["string[] - Key values/properties"]
      },
      "after": {
        "name": "string - Structure name",
        "state": "string - Final state representation",
        "values": ["string[] - Updated values/properties"]
      },
      "changes": ["string[] - Key changes that occurred"]
    }
  }
}

Example for memory allocation:
{
  "stepDetails": {
    "dataStructures": {
      "before": {
        "name": "vm_area_struct",
        "state": "Initial VMA state",
        "values": [
          "start: 0x1000",
          "end: 0x2000",
          "flags: READ"
        ]
      },
      "after": {
        "name": "vm_area_struct",
        "state": "Updated VMA state",
        "values": [
          "start: 0x1000",
          "end: 0x3000",
          "flags: READ|WRITE"
        ]
      },
      "changes": [
        "Extended memory region by 4KB",
        "Added WRITE permission"
      ]
    }
  }
}`;

export async function POST(request: Request) {
  try {
    const { stepId } = await request.json();
    console.log('[Step Details API] Request received:', { stepId });

    const response = await fetch(process.env.CLAUDE_API_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL,
        messages: [{ 
          role: 'user',
          content: `${STEP_DETAILS_PROMPT}\n\nAnalyze step: ${stepId}`
        }],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const messageContent = data.content?.[0]?.text;
    console.log('[Step Details API] Received response:', { messageContent });

    // Extract JSON from response
    const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const stepDetails = JSON.parse(jsonMatch[0]);
    console.log('[Step Details API] Parsed details:', stepDetails);

    return NextResponse.json({
      type: 'UPDATE_STEP',
      payload: {
        stepId,
        variables: {
          before: stepDetails.stepDetails.dataStructures.before,
          after: stepDetails.stepDetails.dataStructures.after,
          changes: stepDetails.stepDetails.dataStructures.changes
        }
      }
    });

  } catch (error: any) {
    console.error('[Step Details API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch step details' },
      { status: 500 }
    );
  }
} 