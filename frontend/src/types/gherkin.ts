export interface ScenarioStep {
  name?: string;
  entryPoint?: string;
  regions?: StepRegion[];
  content?: string;
  lineNumber?: number;
  type: 'step' | 'code_block' | 'concept' | 'variable' | 'metadata';
}

export interface ScenarioSection {
  name: string;
  description?: string;
  tag?: string;
  steps: ScenarioStep[];
  concepts: Record<number, string>;
  variables: Record<number, VariableState[]>;
}

export interface FeatureContent {
  title: string;
  description?: string;
  scenarios: ScenarioSection[];
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

export interface GitFeatureContent extends FeatureContent {
  source?: string;
  categories?: Record<string, Category>;
  flows?: Flow[];
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