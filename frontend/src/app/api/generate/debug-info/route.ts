import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

// Define response structure schema
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

// Error handling utility
const createErrorResponse = (message: string, details?: any) => {
  console.error(`Error: ${message}`, details);
  return NextResponse.json(
    { error: message, details },
    { status: 500 }
  );
};

// Logging utility
const logger = {
  request: (prompt: string, payload: any) => {
    console.log('\n=== Debug Info Generation Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Prompt:', prompt);
    console.log('Payload:', JSON.stringify(payload, null, 2));
  },
  response: (prompt: string, response: any) => {
    console.log('\n=== Debug Info Generation Response ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Prompt:', prompt);
    console.log('Response:', JSON.stringify(response, null, 2));
  }
};

export async function POST(request: Request) {
  try {
    // 1. Request Validation
    const { prompt } = await request.json();
    if (!prompt) {
      return createErrorResponse('Prompt is required');
    }

    // 2. Enhanced System Prompt with JSON Template
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

Make the scenario detailed but focused - quality over quantity.`;

    // 3. Create Enhanced LLM Request
    const llmPayload = {
      model: process.env.CLAUDE_MODEL,
      system: systemPrompt,
      messages: [
        { 
          role: 'user',
          content: `Create a detailed debugging scenario for: ${prompt}. Include multiple steps with variable states, meaningful code blocks, and clear conceptual explanations.`
        }
      ],
      max_tokens: 4000,
      temperature: 0.7 // Add some creativity while maintaining coherence
    };

    // 4. Log Request
    logger.request(prompt, llmPayload);

    // 5. Make API Request with Error Handling
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

    // 6. Process Response
    const data = await response.json();

    // Log raw response
    console.log('\n=== Raw API Response ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Complete Response:', data);
    console.log('======================\n');
    
    // Extract content based on API version
    const messageContent = data.content?.[0]?.text || data.completion;
    if (!messageContent) {
      throw new Error('No content in API response');
    }

    // Log extracted message content
    console.log('\n=== Raw Message Content ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Content:', messageContent);
    console.log('========================\n');

    // 7. Extract and Validate JSON
    const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const jsonContent = JSON.parse(jsonMatch[0]);

    // Add detailed logging before validation
    console.log('\n=== Pre-Validation Response Content ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Raw JSON Structure:', JSON.stringify(jsonContent, null, 2));
    console.log('Feature Name:', jsonContent?.feature?.name);
    console.log('Number of Scenarios:', jsonContent?.feature?.scenarios?.length);
    console.log('Categories:', Object.keys(jsonContent?.feature?.categories || {}));
    console.log('=======================================\n');

    // 8. Schema Validation
    const validationResult = ResponseSchema.safeParse(jsonContent);
    if (!validationResult.success) {
      console.error('\n=== Validation Error Details ===');
      console.error('Error:', validationResult.error.message);
      console.error('Failed at:', validationResult.error.errors);
      console.error('===============================\n');
      throw new Error(`Invalid response structure: ${validationResult.error.message}`);
    }

    // Only validate code block name uniqueness
    const codeBlockNames = new Set();
    for (const scenario of jsonContent.feature.scenarios) {
      for (const step of scenario.steps) {
        for (const section of step.sections) {
          for (const block of section.codeBlocks) {
            if (codeBlockNames.has(block.name)) {
              throw new Error(`Duplicate code block name found: ${block.name}`);
            }
            codeBlockNames.add(block.name);
          }
        }
      }
    }

    // Validate proper variable state transitions
    for (const scenario of jsonContent.feature.scenarios) {
      for (const step of scenario.steps) {
        for (const section of step.sections) {
          for (const block of section.codeBlocks) {
            if (block.variables) {
              for (const variable of block.variables) {
                if (variable.previous !== undefined && 
                    variable.previous === variable.current) {
                  console.warn(`Warning: Variable ${variable.name} shows no state change`);
                }
              }
            }
          }
        }
      }
    }

    // 9. Save Response for Analysis
    const tempDir = path.join(process.cwd(), 'temp');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `debug-info-${timestamp}.json`;

    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(
      path.join(tempDir, filename),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        prompt,
        response: jsonContent
      }, null, 2)
    );

    // 10. Log Response
    //logger.response(prompt, jsonContent);

    // 11. Enrich Response with Metadata
    const enrichedResponse = {
      ...jsonContent,
      metadata: {
        generatedAt: new Date().toISOString(),
        prompt,
        model: process.env.CLAUDE_MODEL,
        savedAs: filename
      }
    };

    return NextResponse.json(enrichedResponse);

  } catch (error) {
    let errorMessage = 'Failed to generate debug info';
    let errorDetails = null;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack;
    }

    return createErrorResponse(errorMessage, errorDetails);
  }
}