import { FeatureContent } from '@/types/gherkin';

export const fetchStepData = async (codeBlockName: string): Promise<{
  code?: string[];
  variables?: VariableState[];
  concepts?: {
    title: string;
    points: string[];
    focus: string;
  };
}> => {
  console.log('[AsyncDebugService] Fetching debug step data:', { codeBlockName });
  
  try {
    const response = await fetch(`/api/fetch/debug-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ codeBlockName }),
    });

    console.log('[AsyncDebugService] Received response:', { 
      status: response.status,
      ok: response.ok 
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[AsyncDebugService] Response not OK:', errorData);
      throw new Error(errorData.error || 'Failed to fetch debug step data');
    }

    const data = await response.json();
    console.log('[AsyncDebugService] Successfully parsed response data:', {
      hasCode: !!data.code,
      hasVariables: !!data.variables,
      hasConcepts: !!data.concepts
    });
    
    return data;
  } catch (error) {
    console.error('[AsyncDebugService] Error fetching debug step data:', error);
    throw error;
  }
}; 