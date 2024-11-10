import { FeatureContent, ScenarioSection, ScenarioStep, VariableState } from '@/types/gherkin';

export const parseGherkinFile = async (content: string): Promise<FeatureContent> => {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  
  let title = '';
  let description = '';
  const scenarios: ScenarioSection[] = [];
  let currentScenario: Partial<ScenarioSection> | undefined;
  let currentSteps: ScenarioStep[] = [];
  let currentConcepts: Record<number, string> = {};
  let currentVariables: Record<number, VariableState[]> = {};
  
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('Feature:')) {
      title = trimmedLine.substring('Feature:'.length).trim();
    } else if (trimmedLine.startsWith('Scenario:')) {
      // Save previous scenario if exists
      if (currentScenario) {
        scenarios.push({
          name: currentScenario.name || '',
          description: currentScenario.description,
          tag: currentScenario.tag,
          steps: currentSteps,
          concepts: currentConcepts,
          variables: currentVariables
        });
      }
      
      // Reset for new scenario
      currentSteps = [];
      currentConcepts = {};
      currentVariables = {};
      
      // Parse scenario metadata
      const scenarioMatch = trimmedLine.match(/^Scenario:\s*(.+?)(?:\s+@(\w+))?$/);
      currentScenario = {
        name: scenarioMatch?.[1] || '',
        tag: scenarioMatch?.[2],
        description: '',
        steps: [],
        concepts: {},
        variables: {}
      };
    } else if (trimmedLine.startsWith('@')) {
      // Handle tags
      if (currentScenario) {
        currentScenario.tag = trimmedLine.substring(1);
      }
    } else if (currentScenario) {
      // Handle steps and metadata
      if (trimmedLine.match(/^(Given|When|Then|And|But)\s/)) {
        currentSteps.push(trimmedLine);
      } else if (!currentScenario.description) {
        // If not a step and no description yet, treat as scenario description
        currentScenario.description = (currentScenario.description || '') + trimmedLine + '\n';
      }
    } else if (!title) {
      description += line + '\n';
    }
  });
  
  // Add the last scenario
  if (currentScenario) {
    scenarios.push({
      name: currentScenario.name || '',
      description: currentScenario.description?.trim(),
      tag: currentScenario.tag,
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

// Helper function to extract variables from a line
const extractVariables = (line: string): VariableState[] => {
  const variables: VariableState[] = [];
  const variableMatches = line.matchAll(/(\w+)\s*=\s*([^,]+)(?:,|$)/g);
  
  for (const match of variableMatches) {
    const [, name, value] = match;
    variables.push({
      name: name.trim(),
      value: value.trim(),
      type: inferType(value.trim()),
      current: value.trim(),
      previous: undefined,
      changed: false
    });
  }
  
  return variables;
};

// Helper function to infer variable type
const inferType = (value: string): string => {
  if (value.match(/^-?\d+$/)) return 'number';
  if (value.match(/^-?\d*\.\d+$/)) return 'float';
  if (value.match(/^(true|false)$/i)) return 'boolean';
  if (value.match(/^[\[\{]/)) return 'object';
  return 'string';
};