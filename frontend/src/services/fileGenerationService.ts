import { GitFeatureContent } from '@/types/gherkin';

export async function generateGherkinFile(prompt: string): Promise<string> {
  try {
    const response = await fetch('/api/generate/gherkin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate Gherkin file');
    }

    const data = await response.json();
    if (!data.content) {
      throw new Error('Invalid response format from server');
    }

    return data.content;
  } catch (error) {
    console.error('Error generating Gherkin file:', error);
    throw error;
  }
}

export async function generateDebugInfoJson(prompt: string): Promise<GitFeatureContent> {
  try {
    const response = await fetch('/api/generate/debug-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate debug info JSON');
    }

    const data = await response.json();
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from server');
    }

    return data;
  } catch (error) {
    console.error('Error generating debug info JSON:', error);
    throw error;
  }
} 