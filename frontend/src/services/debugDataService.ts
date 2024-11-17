import { GitFeatureContent } from '@/types/gherkin';

// Mock implementation - replace with actual data fetching logic
export const fetchCodeBlockData = async (codeBlockName: string) => {
  // Example: Fetch from database or in-memory store
  const featureContent: GitFeatureContent = await getFeatureContent(); // Implement getFeatureContent accordingly

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