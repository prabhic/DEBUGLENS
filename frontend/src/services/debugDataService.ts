import { FeatureContent } from '@/types/gherkin';

let featureContentCache: FeatureContent | null = null;

export const setFeatureContent = (content: FeatureContent) => {
  console.log('[DebugDataService] Setting feature content:', {
    hasContent: !!content,
    scenarios: content?.scenarios?.length
  });
  featureContentCache = content;
};

export const getFeatureContent = async (): Promise<FeatureContent> => {
  if (!featureContentCache) {
    console.error('[DebugDataService] Feature content not initialized');
    throw new Error('Feature content not initialized');
  }
  return featureContentCache;
};

export const fetchCodeBlockData = async (codeBlockName: string) => {
  const featureContent = await getFeatureContent();
  console.log('[DebugDataService] Fetching code block:', { 
    codeBlockName,
    hasFeatureContent: !!featureContent 
  });
  
  for (const scenario of featureContent.scenarios) {
    for (const step of scenario.steps) {
      if (!step.sections) {
        console.warn('[DebugDataService] Step has no sections:', step);
        continue;
      }
      
      for (const section of step.sections) {
        if (!section.codeBlocks) {
          console.warn('[DebugDataService] Section has no codeBlocks:', section);
          continue;
        }
        
        for (const block of section.codeBlocks) {
          if (block.name === codeBlockName) {
            console.log('[DebugDataService] Found code block:', {
              name: block.name,
              codeLines: block.code.length
            });
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

  console.warn('[DebugDataService] Code block not found:', codeBlockName);
  return null;
}; 