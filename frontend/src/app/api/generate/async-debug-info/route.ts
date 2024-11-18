import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Using the same ResponseSchema from the original route
const ResponseSchema = z.object({
  feature: z.object({
    name: z.string(),
    description: z.string(),
    source: z.string(),
    categories: z.record(z.object({
      scenarios: z.array(z.string()),
      complexity: z.string()
    })).optional(),
    flows: z.array(z.object({
      name: z.string(),
      complexity: z.string(),
      time: z.string(),
      prerequisites: z.string()
    })),
    scenarios: z.array(z.object({
      name: z.string(),
      description: z.string(),
      tag: z.string(),
      steps: z.array(z.object({
        name: z.string(),
        entryPoint: z.string().optional(),
        sections: z.array(z.object({
          name: z.string(),
          codeBlocks: z.array(z.object({
            name: z.string(),
            code: z.array(z.string()),
            variables: z.array(z.object({
              name: z.string(),
              previous: z.any().optional(),
              current: z.any(),
              type: z.string(),
              important: z.boolean().optional()
            })).optional(),
            conceptDetails: z.object({
              title: z.string(),
              points: z.array(z.string()),
              focus: z.string()
            }).optional()
          }))
        }))
      }))
    }))
  })
});

// In-memory session storage
const sessions: Record<string, any> = {};

async function logResponse(sessionId: string, response: any) {
  try {
    const logDir = path.join(process.cwd(), 'logs', 'async-debug');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = `response-${sessionId}-${timestamp}.log`;

    await fs.mkdir(logDir, { recursive: true });
    await fs.writeFile(
      path.join(logDir, logFile),
      JSON.stringify({
        timestamp,
        sessionId,
        response,
        metadata: {
          nodeEnv: process.env.NODE_ENV,
          model: process.env.CLAUDE_MODEL,
        }
      }, null, 2)
    );
  } catch (error) {
    console.error('Failed to log response:', error);
  }
}

export async function POST(request: Request) {
  try {
    // 1. Request Validation
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 2. Create Session ID
    const sessionId = uuidv4();
    
    // 3. Use the same system prompt from original route
    const systemPrompt = `Generate a detailed debug walkthrough explaining how ${prompt} is implemented internally in the source code. Focus on the actual implementation details, data structures, and algorithms used, not on how to use the feature.

Your response must follow this exact JSON structure:

{
  "feature": {
    "name": "string - Name of the feature being debugged",
    "description": "string - Detailed description of the feature",
    "source": "string - Source/context of the feature",
    "categories": {
      "category_name": {
        "scenarios": ["array of scenario names that belong to this category"],
        "complexity": "string - one of: Basic, Advanced, Expert"
      }
    },
    "flows": [
      {
        "name": "string - Name of the debug flow",
        "complexity": "string - Complexity level",
        "time": "string - Estimated time (e.g., '5 mins')",
        "prerequisites": "string - Required prior knowledge"
      }
    ],
    "scenarios": [
      {
        "name": "string - Must match a scenario name from categories",
        "description": "string - Detailed scenario description",
        "tag": "string - Category tag (e.g., BasicScenario)",
        "steps": [
          {
            "name": "string - Step name",
            "entryPoint": "string - Optional entry point description",
            "sections": [
              {
                "name": "string - Section name",
                "codeBlocks": [
                  {
                    "name": "string - Unique name for the code block",
                    "code": ["array of code lines"],
                    "variables": [
                      {
                        "name": "string - Variable name",
                        "previous": "any - Previous value (optional)",
                        "current": "any - Current value",
                        "type": "string - Variable type",
                        "important": "boolean - Whether this is a key variable"
                      }
                    ],
                    "conceptDetails": {
                      "title": "string - Concept title",
                      "points": ["array of key points about the concept"],
                      "focus": "string - Main learning focus"
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}

Important Requirements:
1. Focus on ACTUAL IMPLEMENTATION CODE, not usage examples
2. Show the real internal data structures and algorithms
3. Track internal state changes in core data structures
4. Explain implementation decisions and their implications
5. Each code block should show a distinct part of the internal implementation
6. Include important edge cases in the implementation

Example focus areas:
- Internal data structures used
- Memory management approaches
- Algorithm implementation details
- Performance optimizations
- Edge case handling
- Error handling mechanisms
- State management internals

The goal is to understand HOW the feature works internally, not how to use it.

Important Requirements:
1. Focus on creating ONE complete, coherent debugging scenario
2. Each code block should contain real, executable code
3. Track meaningful variable state changes
4. Include clear concept explanations at each step
5. Each code block must have a unique name
6. Ensure proper flow between steps

Make the scenario detailed but focused - quality over quantity.

Note: For async generation, provide the basic structure first with placeholder content.`;

    // 4. Create Enhanced LLM Request for Initial Structure
    const llmPayload = {
      model: process.env.CLAUDE_MODEL,
      system: systemPrompt,
      messages: [
        { 
          role: 'user',
          content: `Create an initial structure for: ${prompt}. Include basic scenario outline and step names, with placeholder content for details.`
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    };

    // 5. Make Initial API Request
    const response = await fetch(process.env.CLAUDE_API_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(llmPayload)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    const messageContent = data.content?.[0]?.text || data.completion;
    
    if (!messageContent) {
      throw new Error('No content in API response');
    }

    // 6. Extract JSON
    const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const jsonContent = JSON.parse(jsonMatch[0]);

    // 7. Schema Validation
    const validationResult = ResponseSchema.safeParse(jsonContent);
    if (!validationResult.success) {
      console.error('\n=== Validation Error Details ===');
      console.error('Error:', validationResult.error.message);
      console.error('Failed at:', validationResult.error.errors);
      console.error('===============================\n');
      throw new Error(`Invalid response structure: ${validationResult.error.message}`);
    }

    // 8. Store Session Data
    sessions[sessionId] = {
      prompt,
      content: jsonContent,
      completedSteps: new Set(),
      timestamp: new Date().toISOString()
    };

    // 9. Save Initial Response
    const tempDir = path.join(process.cwd(), 'temp', 'async-sessions');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `debug-session-${sessionId}-${timestamp}.json`;

    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(
      path.join(tempDir, filename),
      JSON.stringify({
        sessionId,
        timestamp: new Date().toISOString(),
        prompt,
        initialContent: jsonContent
      }, null, 2)
    );

    // 10. Log Response
    await logResponse(sessionId, jsonContent);

    // 11. Return Initial Response
    return NextResponse.json({
      sessionId,
      content: jsonContent.feature,
      metadata: {
        generatedAt: new Date().toISOString(),
        prompt,
        model: process.env.CLAUDE_MODEL,
        savedAs: filename,
        mode: 'async'
      }
    });

  } catch (error: any) {
    let errorMessage = 'Failed to generate async debug info';
    let errorDetails = null;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack;
    }

    return NextResponse.json({ error: errorMessage, details: errorDetails }, { status: 500 });
  }
} 