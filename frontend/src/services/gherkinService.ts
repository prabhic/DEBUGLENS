import { FeatureContent, ScenarioSection, ScenarioStep } from '@/types/gherkin';

export const parseGherkinFile = async (content: string): Promise<FeatureContent> => {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  
  let title = '';
  let description = '';
  const scenarios: ScenarioSection[] = [];
  let currentScenario: ScenarioSection | undefined;
  let currentSteps: ScenarioStep[] = [];
  let currentConcepts: Record<number, string> = {};
  let currentVariables: Record<number, VariableState[]> = {};
  let lineNumber = 1;
  
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('Feature:')) {
      title = trimmedLine.substring('Feature:'.length).trim();
    } else if (trimmedLine.startsWith('Scenario:')) {
      // Save previous scenario if exists
      if (currentScenario) {
        scenarios.push({
          ...currentScenario,
          steps: currentSteps,
          concepts: currentConcepts,
          variables: currentVariables
        });
      }
      
      // Reset for new scenario
      currentSteps = [];
      currentConcepts = {};
      currentVariables = {};
      currentScenario = {
        title: trimmedLine.substring('Scenario:'.length).trim(),
        steps: [],
        concepts: {},
        variables: {}
      };
    } else if (currentScenario) {
      const stepType = categorizeStep(line);
      
      switch (stepType) {
        case 'step':
        case 'code_block':
          currentSteps.push({
            content: line,
            lineNumber,
            type: stepType
          });
          break;
          
        case 'concept':
          // Store concept for the previous step
          if (currentSteps.length > 0) {
            const lastStep = currentSteps[currentSteps.length - 1];
            currentConcepts[lastStep.lineNumber] = extractConcept(line);
          }
          break;
          
        case 'variable':
          // Store variables for the previous step
          if (currentSteps.length > 0) {
            const lastStep = currentSteps[currentSteps.length - 1];
            currentVariables[lastStep.lineNumber] = extractVariables(line);
          }
          break;
      }
    } else if (!title) {
      description += line + '\n';
    }
    
    lineNumber++;
  });
  
  // Add the last scenario
  if (currentScenario) {
    scenarios.push({
      ...currentScenario,
      steps: currentSteps,
      concepts: currentConcepts,
      variables: currentVariables
    });
  }
  
  return {
    title,
    description: description.trim(),
    scenarios
  };
};

const categorizeStep = (line: string): ScenarioStep['type'] => {
  const trimmedLine = line.trim();
  if (trimmedLine.match(/^(Given|When|Then|And)\s/)) return 'step';
  if (trimmedLine.includes('"""')) return 'code_block';
  if (trimmedLine.startsWith('Concepts:')) return 'concept';
  if (trimmedLine.startsWith('Variables:')) return 'variable';
  return 'metadata';
};

const extractConcept = (line: string): string => {
  return line.replace('Concepts:', '').trim();
};

const extractVariables = (line: string): VariableState[] => {
  // Implement variable extraction logic based on your format
  // This is a placeholder implementation
  return [];
};