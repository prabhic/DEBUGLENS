import { FeatureContent } from '@/types/gherkin';

export const fetchStepData = async (stepName: string, featureContent: FeatureContent) => {
  try {
    console.log('[AsyncDebugService] Fetching step data:', {
      stepName,
      hasFeatureContent: !!featureContent,
      featureName: featureContent?.name
    });

    const response = await fetch(`/api/fetch/step-details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        stepName,
        featureContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[AsyncDebugService] API error:', {
        status: response.status,
        error: errorData
      });
      throw new Error(`API call failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[AsyncDebugService] Error fetching step data:', error);
    throw error;
  }
}; 