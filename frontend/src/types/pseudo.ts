export interface PseudoSection {
  level: string;
  content: string[];
}

export interface PseudoContent {
  abstraction_levels: string[];
  sections: PseudoSection[];
}

export interface PseudoResponse {
  content: PseudoContent;
}

export interface VariableState {
  name: string;
  value: any;
  type: string;
}

export interface DebuggerState {
  isDebugging: boolean;
  currentLine: number | null;
  breakpoints: Set<number>;
  isPaused: boolean;
  variables: VariableState[];
} 