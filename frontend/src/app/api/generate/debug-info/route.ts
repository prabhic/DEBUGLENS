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

// Update the template to match the reference exactly
const RESPONSE_TEMPLATE = {
  feature: {
    name: "",
    description: "",
    source: "",
    categories: {
      "Basics": {
        scenarios: ["Object Storage", "Simple Commits"],
        complexity: "Beginner"
      },
      "Advanced": {
        scenarios: ["Complex Operation 1", "Complex Operation 2"],
        complexity: "Advanced"
      }
    },
    flows: [
      {
        name: "Basic Flow",
        complexity: "Basic",
        time: "5 mins",
        prerequisites: "None"
      },
      {
        name: "Advanced Flow",
        complexity: "Advanced",
        time: "10 mins",
        prerequisites: "Basic Flow"
      }
    ],
    scenarios: [
      {
        name: "Main Scenario name",
        description: "implementation details on scenario",
        tag: "BasicScenario",
        steps: [
          {
            name: "Initialize Structure",
            entryPoint: "Entry point description",
            sections: [
              {
                name: "Setup Section",
                codeBlocks: [
                  {
                    name: "Initial Setup",
                    code: [
                      "// Example code structure",
                      "const data = {",
                      "  key: 'value'",
                      "}"
                    ],
                    variables: [
                      {
                        name: "data",
                        previous: null,
                        current: { key: 'value' },
                        type: "object",
                        important: true
                      }
                    ],
                    conceptDetails: {
                      title: "Core Concept",
                      points: [
                        "Implementation detail 1",
                        "Implementation detail 2"
                      ],
                      focus: "Main technical focus"
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
};

// Update system prompt to remove strict step count requirement
const getSystemPrompt = (prompt: string) => `
Generate a detailed debug walkthrough explaining how ${prompt} is implemented internally in the source code.

CRITICAL: Your response must match this reference structure EXACTLY:

1. First Scenario Requirements:
   - Must include essential implementation steps
   - EVERY step MUST have an entryPoint that specifies:
     * The function/method where the step begins
     * The file or module location if relevant
     * Example: "Entry point: parseConfig() in config_parser.go"

2. EntryPoint Format for Each Step:
   - Must clearly indicate where the code execution begins
   - Should follow format: "Entry point: function() in file"
   - Examples:
     * "Entry point: initContainer() in container.go"
     * "Entry point: processRequest() in handler/request.go"
     * "Entry point: validateInput() in validator/input.go"

3. First Scenario Must Cover:
   - Essential setup/initialization
   - Core implementation logic
   - Important state changes
   - Key technical concepts

4. Other Scenarios:
   - Can be simpler
   - Should cover different aspects
   - Don't need full implementation details

Here's the exact structure to follow:

${JSON.stringify(RESPONSE_TEMPLATE, null, 2)}

Remember:
1. Focus on ESSENTIAL implementation steps
2. Each code block must show actual implementation with less number of lines
3. Track important variable states
4. Include technical concept explanations
5. Follow the exact structure of the reference`;

// Improve JSON extraction
const extractJsonFromResponse = (content: string): any => {
  // Remove markdown formatting if present
  const cleanContent = content.replace(/```json\n|\n```/g, '');
  
  try {
    // Try to parse the entire content first
    return JSON.parse(cleanContent);
  } catch (e) {
    console.log('Failed to parse complete content, trying to extract JSON object');
    
    // Try to extract just the JSON object
    const jsonMatch = cleanContent.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      try {
        const extracted = JSON.parse(jsonMatch[1]);
        return extracted;
      } catch (e) {
        console.log('Failed to parse extracted JSON:', e);
      }
    }
  }
  
  throw new Error('No valid JSON found in response');
};

// Update validation to match reference exactly
const validateStepStructure = (step: any): string[] => {
  const errors: string[] = [];

  // Validate step matches reference structure
  if (!step.name) errors.push('Step missing name');
  if (!step.entryPoint) errors.push(`Step "${step.name}" missing entryPoint`);
  if (!step.sections || !Array.isArray(step.sections)) {
    errors.push(`Step "${step.name}" missing sections array`);
    return errors;
  }

  step.sections.forEach((section: any, sIndex: number) => {
    if (!section.name) {
      errors.push(`Section ${sIndex} in step "${step.name}" missing name`);
    }
    if (!section.codeBlocks || !Array.isArray(section.codeBlocks)) {
      errors.push(`Section "${section.name}" missing codeBlocks array`);
      return;
    }

    section.codeBlocks.forEach((block: any, bIndex: number) => {
      // Validate code block matches reference structure exactly
      if (!block.name) {
        errors.push(`Code block ${bIndex} missing name`);
      }
      if (!block.code || !Array.isArray(block.code) || block.code.length === 0) {
        errors.push(`Code block "${block.name}" missing or empty code array`);
      }
      if (!block.variables && !block.conceptDetails) {
        errors.push(`Code block "${block.name}" missing both variables and conceptDetails`);
      }
      if (block.variables) {
        block.variables.forEach((variable: any) => {
          if (!variable.name || variable.current === undefined || !variable.type) {
            errors.push(`Variable in "${block.name}" missing required fields`);
          }
        });
      }
      if (block.conceptDetails) {
        const { title, points, focus } = block.conceptDetails;
        if (!title || !points || !Array.isArray(points) || !focus) {
          errors.push(`Concept details in "${block.name}" missing required fields`);
        }
      }
    });
  });

  return errors;
};

// Update validateCompleteness to be more flexible with step count
const validateCompleteness = (content: any): string[] => {
  const errors: string[] = [];
  
  if (!content.feature.scenarios || content.feature.scenarios.length === 0) {
    errors.push('No scenarios found');
    return errors;
  }

  // Validate first scenario thoroughly
  const mainScenario = content.feature.scenarios[0];
  
  // Check if main scenario has steps
  if (!mainScenario.steps || mainScenario.steps.length === 0) {
    errors.push(`Main scenario "${mainScenario.name}" must have implementation steps`);
  }
  
  // Validate each step structure in main scenario
  mainScenario.steps?.forEach((step: any, index: number) => {
    const stepErrors = validateStepStructure(step);
    if (stepErrors.length > 0) {
      errors.push(`Step ${index + 1} structure errors: ${stepErrors.join(', ')}`);
    }
  });

  // Basic validation for categories and flows
  const categories = Object.keys(content.feature.categories || {});
  if (categories.length === 0) {
    errors.push('Must have at least one category');
  }

  if (!content.feature.flows || content.feature.flows.length === 0) {
    errors.push('Must have at least one flow');
  }

  return errors;
};

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return createErrorResponse('Prompt is required');
    }

    // Create LLM request with updated system prompt
    const llmPayload = {
      model: process.env.CLAUDE_MODEL,
      system: getSystemPrompt(prompt),
      messages: [
        {
          role: 'user',
          content: 'Generate the debug walkthrough JSON. Remember to return ONLY the JSON object, no other text.'
        }
      ],
      max_tokens: 4000,
      temperature: 0.5 // Lower temperature for more consistent formatting
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

    // Use the new extraction function
    const jsonContent = extractJsonFromResponse(messageContent);

    // Add detailed logging before validation
    console.log('\n=== Pre-Validation Response Content ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Raw JSON Structure:', JSON.stringify(jsonContent, null, 2));
    console.log('Feature Name:', jsonContent?.feature?.name);
    console.log('Number of Scenarios:', jsonContent?.feature?.scenarios?.length);
    console.log('Categories:', Object.keys(jsonContent?.feature?.categories || {}));
    console.log('=======================================\n');

    // Validate against template structure
    const validateStructure = (template: any, content: any, path = ''): string[] => {
      const errors: string[] = [];
      
      for (const key in template) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in content)) {
          errors.push(`Missing required property: ${currentPath}`);
          continue;
        }
        
        if (typeof template[key] === 'object' && template[key] !== null) {
          if (Array.isArray(template[key])) {
            if (!Array.isArray(content[key])) {
              errors.push(`${currentPath} should be an array`);
            }
          } else {
            errors.push(...validateStructure(template[key], content[key], currentPath));
          }
        }
      }
      
      return errors;
    };

    const structureErrors = validateStructure(RESPONSE_TEMPLATE, jsonContent);
    if (structureErrors.length > 0) {
      throw new Error(`Invalid response structure: ${structureErrors.join(', ')}`);
    }

    // Add this to the POST handler before returning the response
    const completenessErrors = validateCompleteness(jsonContent);
    if (completenessErrors.length > 0) {
      throw new Error(`Incomplete response: ${completenessErrors.join(', ')}`);
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