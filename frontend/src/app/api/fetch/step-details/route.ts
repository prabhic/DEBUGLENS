import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const requestStart = new Date().toISOString();
  
  try {
    console.log(`[StepDetails API] ${requestStart} - Request received`);
    
    const { stepName, featureContent } = await request.json();
    
    console.log('[StepDetails API] Request payload:', {
      timestamp: requestStart,
      stepName,
      featureContext: {
        name: featureContent?.name,
        hasDescription: !!featureContent?.description,
        hasSource: !!featureContent?.source,
        scenariosCount: featureContent?.scenarios?.length
      }
    });

    if (!stepName || !featureContent) {
      console.error('[StepDetails API] Missing required fields:', {
        hasStepName: !!stepName,
        hasFeatureContent: !!featureContent
      });
      return NextResponse.json({ 
        error: 'stepName and featureContent are required' 
      }, { status: 400 });
    }

    // Create system prompt with context from passed feature content
    const systemPrompt = `You are explaining the implementation of the step "${stepName}" in ${featureContent.name}.

Context:
${featureContent.description}
Source: ${featureContent.source}

Response Format:
{
  "sections": [
    {
      "name": "string - Brief section name",
      "codeBlocks": [
        {
          "name": "string - What this code demonstrates",
          "code": ["3-5 lines of essential code showing the core concept"],
          "variables": [
            {
              "name": "string - Variable name",
              "value": "any - Current value",
              "type": "string - Type",
              "purpose": "string - Brief explanation of variable's role"
            }
          ],
          "conceptDetails": {
            "title": "string - Main concept",
            "focus": "string - Key takeaway (1-2 sentences)"
          }
        }
      ]
    }
  ]
}

Requirements:
1. Show only the most essential code (3-5 lines per block)
2. Include only key variables that are crucial for understanding
3. Focus on one core concept per code block
4. Use real code examples from ${featureContent.source}
5. Keep explanations brief and focused`;

    // Find the specific step context
    const scenario = featureContent.scenarios.find(s => 
      s.steps.some(step => step.name === stepName)
    );

    console.log('[StepDetails API] Found scenario context:', {
      stepName,
      scenarioName: scenario?.name,
      hasScenarioDescription: !!scenario?.description
    });

    // Create the LLM request with full context
    const llmPayload = {
      model: process.env.CLAUDE_MODEL,
      system: systemPrompt,
      messages: [
        { 
          role: 'user',
          content: `Generate detailed implementation details for the "${stepName}" step in ${scenario?.name || featureContent.name}. 
This step is part of ${scenario?.description || featureContent.description}.
Include actual code, variables, and concepts that show how this step works internally.`
        }
      ],
      max_tokens: 4000,
      temperature: 0.7,
      stream: false
    };

    console.log('[StepDetails API] Making LLM request:', {
      timestamp: new Date().toISOString(),
      model: process.env.CLAUDE_MODEL,
      stepName,
      hasSystemPrompt: !!systemPrompt,
      messageLength: llmPayload.messages[0].content.length
    });

    // Make API request
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
      console.error('[StepDetails API] LLM API error:', {
        timestamp: new Date().toISOString(),
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`API error: ${response.status}`);
    }

    console.log ('[StepDetails API] LLM response:', response);
    // const responseText = await response.text();
    // console.log('[StepDetails API] LLM response text:', responseText);

    //const data = JSON.parse(responseText);
    
    
    const data = await response.json();
    console.log('[StepDetails API] LLM response JSON:', data);
    const messageContent = data.content?.[0]?.text || data.completion;
    
    if (!messageContent) {
      console.error('[StepDetails API] No content in LLM response');
      throw new Error('No content in API response');
    }

    // Extract JSON from response
    const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[StepDetails API] No JSON found in LLM response');
      throw new Error('No JSON found in response');
    }

    const stepDetails = JSON.parse(jsonMatch[0]);
    const requestEnd = new Date().toISOString();

    console.log('[StepDetails API] Step details:', stepDetails);


    console.log('[StepDetails API] Successfully generated content:', {
      requestStart,
      requestEnd,
      stepName,
      context: {
        feature: featureContent.name,
        scenario: scenario?.name,
      },
      sectionsCount: stepDetails.sections?.length,
      codeBlocksCount: stepDetails.sections?.reduce((acc, section) => 
        acc + (section.codeBlocks?.length || 0), 0
      ),
      responseSize: JSON.stringify(stepDetails).length
    });

    return NextResponse.json(stepDetails, { status: 200 });
  } catch (error: any) {
    const requestEnd = new Date().toISOString();
    console.error('[StepDetails API] Error processing request:', {
      requestStart,
      requestEnd,
      error: error.message,
      stack: error.stack
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 