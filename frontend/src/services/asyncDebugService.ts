import { GitFeatureContent } from '@/types/gherkin';

export const fetchStepData = async (codeBlockName: string): Promise<{
  code?: string[];
  variables?: VariableState[];
  concepts?: {
    title: string;
    points: string[];
    focus: string;
  };
}> => {
  try {
    const response = await fetch(`/api/fetch/debug-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ codeBlockName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch debug step data');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching debug step data:', error);
    throw error;
  }
}; 