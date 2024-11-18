export type ScenarioStep = string | {
  text: string;
  type?: 'step' | 'code_block';
  // other properties as needed
};

export interface ScenarioSection {
  name: string;
  description?: string;
  tag?: string;
  steps: ScenarioStep[];
  concepts: Record<number, string>;
  variables: Record<number, VariableState[]>;
}

export interface FeatureContent {
  name: string;
  description: string;
  source: string;
  scenarios: Array<{
    name: string;
    description?: string;
    tag?: string;
    steps: Array<{
      name: string;
      entryPoint?: string;
      sections: Array<{
        name: string;
        codeBlocks: CodeBlock[];
      }>;
    }>;
  }>;
}

export interface FeatureResponse {
  content: FeatureContent;
}

export interface VariableState {
  name: string;
  value: any;
  type: string;
  important?: boolean;
  previous?: any;
  current?: any;
  changed?: boolean;
}

export interface DebuggerState {
  isDebugging: boolean;
  currentLine: number | null;
  breakpoints: Set<number>;
  isPaused: boolean;
  variables: VariableState[];
  currentScenario?: number;
  currentStep?: number;
}

export interface ScenarioInfo {
  title: string;
  description?: string;
  lineStart: number;
  lineEnd: number;
}

export interface Category {
  scenarios: string[];
  complexity: string;
}

export interface Flow {
  name: string;
  complexity: string;
  time: string;
  prerequisites: string;
}

export interface StepData {
  name: string;
  entryPoint?: string;
  sections: Section[];
}

export interface Section {
  name: string;
  codeBlocks: CodeBlock[];
}

export interface CodeBlock {
  name: string;
  code: string[];
  variables?: VariableState[];
  conceptDetails?: {
    title: string;
    points: string[];
    focus: string;
  };
}

export interface StepRegion {
  name: string;
  breakpoints: Breakpoint[];
}

export interface Breakpoint {
  name: string;
  code: string[];
  variables?: VariableState[];
  concepts?: {
    title: string;
    points: string[];
    focus: string;
  };
} 