import { NextResponse } from 'next/server';

const IMPLEMENTATION_FOCUSED_PROMPT = `Analyze the internal implementation flow of this feature in the codebase. First provide a high-level overview of all major implementation steps, then we'll dive into each step's details.

Response Format:
{
  "implementationFlow": {
    "overview": "string - Brief description of the implementation",
    "steps": [
      {
        "id": "string - unique step id",
        "name": "string - step name (e.g., 'Memory Allocation', 'Tree Construction')",
        "summary": "string - What this step implements",
        "keyStructures": ["string[] - Names of key data structures used"],
        "keyAlgorithms": ["string[] - Names of key algorithms used"],
        "previewCode": "string - Most representative code snippet"
      }
    ],
    "dataFlowDiagram": [
      "string[] - ASCII representation of data flow between steps"
    ]
  }
}

Example for git commit:
{
  "implementationFlow": {
    "overview": "Git commit implementation involves staging area reading, tree construction, and commit object creation",
    "steps": [
      {
        "id": "stage-reading",
        "name": "Index/Staging Area Reading",
        "summary": "Reads the staged files from .git/index",
        "keyStructures": ["index_entry struct", "cache_tree"],
        "keyAlgorithms": ["read_index_from", "read_cache_tree"],
        "previewCode": "struct index_entry { unsigned char sha1[20]; struct cache_time ctime... }"
      },
      // More steps...
    ]
  }
}`;

export async function GET(request: Request) {
  const prompt = new URL(request.url).searchParams.get('prompt');
  console.log('[Stream API] Request received:', { prompt });
  
  if (!prompt) {
    return new NextResponse('Prompt is required', { status: 400 });
  }

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = (type: string, payload: any) => {
    try {
      console.log('[Stream API] Sending event:', { type, payload });
      writer.write(encoder.encode(`data: ${JSON.stringify({ type, payload })}\n\n`));
    } catch (error) {
      console.error('[Stream API] Error sending event:', { type, error });
    }
  };

  try {
    // Initial state
    sendEvent('UPDATE_STATUS', { status: 'generating' });

    // Generate implementation flow
    console.log('[Stream API] Fetching from Claude:', { prompt });
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
          content: `${IMPLEMENTATION_FOCUSED_PROMPT}\n\nAnalyze: ${prompt}`
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
    console.log('[Stream API] Received Claude response:', { messageContent });

    // Send immediate overview while processing
    sendEvent('UPDATE_CODE', {
      stepId: 'overview',
      code: [
        '// Implementation Overview',
        '// Analyzing implementation...',
        '',
        '// Key Implementation Steps:',
        '// 1. Reading source code...',
        '// 2. Analyzing data structures...',
        '// 3. Identifying core algorithms...'
      ],
      concepts: {
        quick: "Analyzing implementation...",
        detailed: {
          title: "Implementation Analysis",
          explanation: ["Analyzing code structure..."],
          impact: "Understanding internal mechanisms"
        }
      },
      status: 'ready'
    });

    // Process the response in chunks
    const lines = messageContent.split('\n');
    let jsonContent = '';
    let inJson = false;
    let braceCount = 0;
    let implementationFlow: any = null;

    console.log('[Stream API] Processing response lines:', { lineCount: lines.length });

    for (const line of lines) {
      // Count braces to properly detect JSON boundaries
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      if (line.includes('{')) inJson = true;
      if (inJson) jsonContent += line;
      
      // Only try to parse when we have complete JSON
      if (braceCount === 0 && inJson) {
        inJson = false;
        try {
          console.log('[Stream API] Attempting to parse JSON chunk:', { jsonContent });
          const parsedData = JSON.parse(jsonContent);
          console.log('[Stream API] Successfully parsed step:', { parsedData });

          if (parsedData.implementationFlow) {
            implementationFlow = parsedData.implementationFlow;
            // Send overview
            sendEvent('UPDATE_CODE', {
              stepId: 'overview',
              code: [
                '// Implementation Overview',
                `// ${implementationFlow.overview}`,
                '',
                '// Key Implementation Steps:'
              ],
              concepts: {
                quick: "Implementation Overview",
                detailed: {
                  title: "Implementation Flow",
                  explanation: [implementationFlow.overview],
                  impact: "Understanding the complete implementation flow"
                }
              },
              status: 'ready'
            });

            // Send each step individually
            implementationFlow.steps.forEach((step: any, index: number) => {
              sendEvent('ADD_IMPLEMENTATION_STEP', {
                stepId: step.id,
                name: step.name,
                summary: step.summary,
                code: [
                  `// ${step.name}`,
                  `// ${step.summary}`,
                  '',
                  step.previewCode || '// Code preview loading...'
                ],
                concepts: {
                  quick: step.summary,
                  detailed: {
                    title: step.name,
                    explanation: [
                      `Key Data Structures: ${step.keyStructures?.join(', ') || 'Loading...'}`,
                      `Key Algorithms: ${step.keyAlgorithms?.join(', ') || 'Loading...'}`
                    ],
                    impact: step.summary
                  }
                }
              });
            });
          }
        } catch (parseError) {
          console.error('[Stream API] Error parsing step:', { 
            error: parseError, 
            jsonContent,
            braceCount 
          });
        }
        jsonContent = '';
      }
    }

    // Send complete status with the first step ID if available
    sendEvent('UPDATE_STATUS', { 
      status: 'ready_for_details',
      firstStepId: implementationFlow?.steps?.[0]?.id
    });

  } catch (error) {
    console.error('[Stream API] Error in streaming debug info:', error);
    sendEvent('UPDATE_STATUS', { 
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to analyze implementation'
    });
  } finally {
    writer.close();
  }

  return new NextResponse(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 