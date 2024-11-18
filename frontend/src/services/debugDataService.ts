import { FeatureContent } from '@/types/gherkin';

let featureContentCache: FeatureContent | null = null;

export const setFeatureContent = (content: FeatureContent) => {
  featureContentCache = content;
};

export const getFeatureContent = async (): Promise<FeatureContent> => {
  if (!featureContentCache) {
    throw new Error('Feature content not initialized');
  }
  return featureContentCache;
};

export const fetchCodeBlockData = async (codeBlockName: string) => {
  const featureContent = await getFeatureContent();
  
  for (const scenario of featureContent.scenarios) {
    for (const step of scenario.steps) {
      for (const section of step.sections) {
        for (const block of section.codeBlocks) {
          if (block.name === codeBlockName) {
            return {
              code: block.code,
              variables: block.variables,
              concepts: block.conceptDetails,
            };
          }
        }
      }
    }
  }

  return null;
}; 