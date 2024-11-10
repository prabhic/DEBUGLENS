import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    // Create the LLM request payload
    const llmPayload = {
      model: process.env.CLAUDE_MODEL,
      messages: [
        { 
          role: 'user', 
          content: `You are tasked with generating a detailed debug info in JSON format,  for  topic on ${prompt}.. This JSON file will be used in a debuglens debugger, which allows users to step through code blocks, watch variable changes, and understand concepts in a debug editor.

The JSON should look similar to below example

<json_structure>
{
  "feature": {
    "name": "Git Internal Operations",
    "description": "Understanding Git's core operations and data structures",
    "source": "git/git source code learning",
    "categories": {
      "Basics": {
        "scenarios": ["Object Storage", "Simple Commits"],
        "complexity": "Beginner"
      },
      "Advanced": {
        "scenarios": ["Merging", "Rebasing", "Cherry-picking"],
        "complexity": "Advanced"
      },
      "Internals": {
        "scenarios": ["Hash Objects", "Pack Files", "Refs"],
        "complexity": "Expert"
      }
    },
    "flows": [
      {
        "name": "Object Storage",
        "complexity": "Basic",
        "time": "5 mins",
        "prerequisites": "None"
      },
      {
        "name": "Commit Creation",
        "complexity": "Basic",
        "time": "8 mins",
        "prerequisites": "Object Storage"
      },
      {
        "name": "Merge Process",
        "complexity": "Advanced",
        "time": "10 mins",
        "prerequisites": "Commit Creation"
      },
      {
        "name": "Rebase Operation",
        "complexity": "Advanced",
        "time": "15 mins",
        "prerequisites": "Merge Process"
      }
    ],
    "scenarios": [
      {
        "name": "Git Object Storage Internals",
        "description": "How Git stores content in its object database",
        "tag": "BasicScenario",
        "steps": [
          {
            "name": "Initialize Repository Structure",
            "entryPoint": "Initialize empty repository",
            "sections": [
              {
                "name": "Repository Setup",
                "codeBlocks": [
                  {
                    "name": "Initial Structure",
                    "code": [
                      "repo = {",
                      "  'latest_commit': None,",
                      "  'refs': {'HEAD': None, 'main': None},",
                      "  'objects': {}",
                      "}"
                    ],
                    "variables": [
                      {
                        "name": "repo",
                        "previous": null,
                        "current": {
                          "latest_commit": null,
                          "refs": { "HEAD": null, "main": null },
                          "objects": {}
                        },
                        "type": "dictionary",
                        "important": true
                      }
                    ],
                    "conceptDetails": {
                      "title": "Git Repository Structure",
                      "points": [
                        "Stores the latest commit reference.",
                        "Manages object storage."
                      ],
                      "focus": "Understanding Git's internal data structure."
                    }
                  },
                  {
                    "name": "Collections Init",
                    "code": [
                      "commits = []",
                      "blobs = []",
                      "trees = []"
                    ],
                    "variables": [
                      {
                        "name": "commits",
                        "current": [],
                        "type": "array",
                        "important": true
                      },
                      {
                        "name": "blobs",
                        "current": [],
                        "type": "array",
                        "important": true
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "name": "Create Blobs",
            "entryPoint": "Create content blobs for storage",
            "sections": [
              {
                "name": "Content Storage",
                "codeBlocks": [
                  {
                    "name": "Define Changes",
                    "code": [
                      "changes = [",
                      "  {'path': 'README.md', 'content': '# Project'},",
                      "  {'path': 'main.py', 'content': 'print(hello)'}",
                      "]"
                    ]
                  },
                  {
                    "name": "Blob Creation Loop",
                    "code": [
                      "for file in changes:",
                      "  content_hash = calculate_hash(file['content'])",
                      "  blob = { 'type': 'blob', 'content': file['content'], 'hash': content_hash }",
                      "  blobs.append(blob)",
                      "  repo['objects'][content_hash] = blob"
                    ],
                    "variables": [
                      {
                        "name": "content_hash",
                        "previous": null,
                        "current": "8c7e5a667f1b771847fe88c01c3de34413a1b08d",
                        "type": "string",
                        "important": true
                      },
                      {
                        "name": "blob",
                        "previous": null,
                        "current": { "type": "blob", "content": "file content" },
                        "type": "dictionary",
                        "important": true
                      }
                    ],
                    "conceptDetails": {
                      "title": "Blob Creation Process",
                      "points": [
                        "Content addressing using SHA-1",
                        "Immutable storage",
                        "Content deduplication"
                      ],
                      "focus": "How Git identifies unique content"
                    }
                  }
                ]
              }
            ]
          },
          {
            "name": "Build Tree",
            "entryPoint": "Organize blobs into a directory tree",
            "sections": [
              {
                "name": "Directory Structure",
                "codeBlocks": [
                  {
                    "name": "Tree Creation",
                    "code": [
                      "tree = {",
                      "  'type': 'tree',",
                      "  'entries': [],",
                      "  'hash': None",
                      "}"
                    ],
                    "variables": [
                      {
                        "name": "tree",
                        "previous": null,
                        "current": { "type": "tree", "entries": [] },
                        "type": "dictionary",
                        "important": true
                      }
                    ],
                    "conceptDetails": {
                      "title": "Tree Structure",
                      "points": [
                        "Represents directory state",
                        "Links to blobs (files)",
                        "Modes indicate file permissions"
                      ],
                      "focus": "Organizing content in a hierarchical structure"
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


</json_structure>


Generate the complete JSON output related to ${prompt}` 
        }
      ],
      max_tokens: 4000,
    };

    // Log the LLM request
    console.log('\n=== LLM Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Endpoint:', process.env.CLAUDE_API_ENDPOINT);
    console.log('Model:', process.env.CLAUDE_MODEL);
    console.log('User Prompt:', prompt);
    console.log('Full Payload:', JSON.stringify(llmPayload, null, 2));

    const response = await fetch(process.env.CLAUDE_API_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(llmPayload),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    try {
      // Extract the content from Claude's response
      const content = data.content[0].text;
      
      // Update to handle both old and new Claude API response formats
      let messageContent;
      if (data.content && Array.isArray(data.content)) {
        // New format: content array with text property
        messageContent = data.content[0].text;
      } else if (data.completion) {
        // Old format: completion property
        messageContent = data.completion;
      } else {
        throw new Error('Unexpected API response format');
      }
      
      // Find the JSON part of the response
      const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const jsonContent = JSON.parse(jsonMatch[0]);
      
      // Log to console
      console.log('\n=== Debug Info Generation Response ===');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Original Prompt:', prompt);
      console.log('Full Response:', content);
      console.log('Parsed JSON:', JSON.stringify(jsonContent, null, 2));

      // Save to temp file
      const tempDir = path.join(process.cwd(), 'temp');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `debug-info-${timestamp}.json`;

      try {
        // Create temp directory if it doesn't exist
        await fs.mkdir(tempDir, { recursive: true });
        
        // Write the response to a file
        await fs.writeFile(
          path.join(tempDir, filename),
          JSON.stringify({
            timestamp: new Date().toISOString(),
            prompt,
            fullResponse: content,
            parsedJson: jsonContent
          }, null, 2)
        );

        console.log(`Response saved to: temp/${filename}`);
      } catch (writeError) {
        console.error('Error writing to temp file:', writeError);
      }
      
      // Validate the structure
      if (!jsonContent.feature || !jsonContent.feature.scenarios) {
        throw new Error('Invalid JSON structure');
      }
      
      return NextResponse.json(jsonContent);
    } catch (parseError) {
      console.error('Error parsing JSON from Claude:', parseError);
      throw new Error('Invalid JSON format received from Claude');
    }

  } catch (error) {
    console.error('Error generating debug info:', error);
    return NextResponse.json(
      { error: 'Failed to generate debug info' },
      { status: 500 }
    );
  }
} 