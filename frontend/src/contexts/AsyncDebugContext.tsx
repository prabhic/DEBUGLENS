// Context and state management for handling asynchronous debug operations
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
// Type for tracking variable values and changes during debugging
import { VariableState } from '@/types/gherkin';

// Structured data about programming concepts being debugged
interface ConceptDetails {
  title: string; // Name of the programming concept
  points: string[]; // Key learning points about the concept
  focus: string; // Main aspect being highlighted
}

// Data structure for a single debug step's state and content
interface DebugStepData {
  status: 'idle' | 'loading' | 'loaded' | 'error'; // Current execution status
  code?: string[]; // Relevant code snippets being debugged
  variables?: VariableState[]; // Variables being tracked
  concepts?: ConceptDetails; // Related programming concepts
  error?: string; // Error message if debug step fails
}

// Global state structure for managing multiple debug steps
interface AsyncDebugState {
  steps: Record<string, DebugStepData>; // Map of step IDs to their debug data
}

// Actions that can modify the debug state
type AsyncDebugAction =
  | { type: 'START_LOADING'; stepId: string } // Begin loading debug data
  | { type: 'LOAD_SUCCESS'; stepId: string; data: Partial<DebugStepData> } // Successfully loaded debug data
  | { type: 'LOAD_FAILURE'; stepId: string; error: string }; // Failed to load debug data

// Initial empty state with no debug steps
const initialState: AsyncDebugState = {
  steps: {},
};

// State reducer handling debug step lifecycle (loading, success, failure)
const asyncDebugReducer = (state: AsyncDebugState, action: AsyncDebugAction): AsyncDebugState => {
  switch (action.type) {
    case 'START_LOADING':
      // Initialize loading state for a debug step
      return {
        ...state,
        steps: {
          ...state.steps,
          [action.stepId]: { status: 'loading' },
        },
      };
    case 'LOAD_SUCCESS':
      // Update step with successfully loaded debug data
      return {
        ...state,
        steps: {
          ...state.steps,
          [action.stepId]: {
            status: 'loaded',
            ...action.data,
          },
        },
      };
    case 'LOAD_FAILURE':
      // Mark step as failed with error message
      return {
        ...state,
        steps: {
          ...state.steps,
          [action.stepId]: {
            status: 'error',
            error: action.error,
          },
        },
      };
    default:
      return state;
  }
};

// Props exposed by the debug context to consumers
interface AsyncDebugContextProps {
  state: AsyncDebugState; // Current debug state
  dispatch: React.Dispatch<AsyncDebugAction>; // Function to update debug state
}

// React Context for sharing debug state across components
const AsyncDebugContext = createContext<AsyncDebugContextProps | undefined>(undefined);

// Provider component that makes debug state available to child components
export const AsyncDebugProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(asyncDebugReducer, initialState);

  return (
    <AsyncDebugContext.Provider value={{ state, dispatch }}>
      {children}
    </AsyncDebugContext.Provider>
  );
};

// Hook for components to access and modify debug state
export const useAsyncDebug = (): AsyncDebugContextProps => {
  const context = useContext(AsyncDebugContext);
  if (!context) {
    throw new Error('useAsyncDebug must be used within an AsyncDebugProvider');
  }
  return context;
}; 
