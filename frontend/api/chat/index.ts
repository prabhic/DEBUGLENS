import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    const { message } = req.body;

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
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    context.res = {
      status: 200,
      body: { message: data.content[0].text },
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: { error: 'Failed to process request' },
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};

export default httpTrigger; 