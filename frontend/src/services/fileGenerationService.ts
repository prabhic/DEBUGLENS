import { FeatureContent } from '@/types/gherkin';
import { isFeatureEnabled } from '@/config/features';

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

export async function generateDebugInfoJson(prompt: string, mode: 'sync' | 'parallel' = 'sync'): Promise<FeatureContent | { sessionId: string; content: FeatureContent }> {
  try {
    const response = await fetch('/api/generate/debug-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, mode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate debug info JSON');
    }

    const data = await response.json();
    if (mode === 'parallel') {
      return {
        sessionId: data.sessionId,
        content: data.content,
      };
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from server');
    }

    return data;
  } catch (error) {
    console.error('Error generating debug info JSON:', error);
    throw error;
  }
}

export async function generateDebugInfoJsonAsync(prompt: string): Promise<{ 
  sessionId: string; 
  content: FeatureContent; 
  metadata: {
    generatedAt: string;
    prompt: string;
    model: string;
    savedAs: string;
    mode: 'async';
  }
}> {
  try {
    const response = await fetch('/api/generate/async-debug-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate async debug info');
    }

    const data = await response.json();
    
    if (!data.sessionId || !data.content) {
      throw new Error('Invalid response format from async server');
    }

    return data;
  } catch (error) {
    console.error('Error generating async debug info:', error);
    throw error;
  }
} 