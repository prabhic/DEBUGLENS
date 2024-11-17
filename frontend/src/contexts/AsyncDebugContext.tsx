// why: Import necessary React hooks and types for context and state management. usedby: AsyncDebugProvider, useAsyncDebug
import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';
// why: Import VariableState type for defining variable structure in DebugStepData. usedby: DebugStepData
import { VariableState } from '@/types/gherkin';

// why: Define structure for concept-related data used in DebugStepData. usedby: DebugStepData
interface ConceptDetails {
  title: string; // why: Title of the concept. usedby: ConceptDetails
  points: string[]; // why: Key points of the concept. usedby: ConceptDetails
  focus: string; // why: Main focus area of the concept. usedby: ConceptDetails
}

// why: Define structure for each debug step's data. usedby: AsyncDebugState
interface DebugStepData {
  status: 'idle' | 'loading' | 'loaded' | 'error'; // why: Track the current status of the debug step. usedby: DebugStepData
  code?: string[]; // why: Optional code snippets related to the debug step. usedby: DebugStepData
  variables?: VariableState[]; // why: Optional variables involved in the debug step. usedby: DebugStepData
  concepts?: ConceptDetails; // why: Optional concept details related to the debug step. usedby: DebugStepData
  error?: string; // why: Optional error message if the step fails. usedby: DebugStepData
}

// why: Define the overall state structure for async debugging. usedby: asyncDebugReducer, AsyncDebugContextProps
interface AsyncDebugState {
  steps: Record<string, DebugStepData>; // why: Store debug steps indexed by unique IDs. usedby: AsyncDebugState
}

// why: Define actions for state transitions in the reducer. usedby: asyncDebugReducer
type AsyncDebugAction =
  | { type: 'START_LOADING'; stepId: string } // why: Action to mark a step as loading. usedby: asyncDebugReducer
  | { type: 'LOAD_SUCCESS'; stepId: string; data: Partial<DebugStepData> } // why: Action to update state with loaded data. usedby: asyncDebugReducer
  | { type: 'LOAD_FAILURE'; stepId: string; error: string }; // why: Action to mark a step as failed with an error. usedby: asyncDebugReducer

// why: Initialize the initial state with no debug steps. usedby: useReducer
const initialState: AsyncDebugState = {
  steps: {}, // why: Start with an empty record of steps. usedby: initialState
};

// why: Reducer function to handle state transitions based on actions. usedby: useReducer
const asyncDebugReducer = (state: AsyncDebugState, action: AsyncDebugAction): AsyncDebugState => {
  switch (action.type) {
    case 'START_LOADING':
      // why: Update state to mark the specified step as loading. usedby: asyncDebugReducer
      return {
        ...state,
        steps: {
          ...state.steps,
          [action.stepId]: { status: 'loading' },
        },
      };
    case 'LOAD_SUCCESS':
      // why: Update state with data for the specified step when loading succeeds. usedby: asyncDebugReducer
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
      // why: Update state to mark the specified step as failed with an error. usedby: asyncDebugReducer
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
      // why: Return current state if action type is unrecognized. usedby: asyncDebugReducer
      return state;
  }
};

// why: Define context properties for providing state and dispatch function. usedby: AsyncDebugContext
interface AsyncDebugContextProps {
  state: AsyncDebugState; // why: Current state of async debugging. usedby: AsyncDebugContextProps
  dispatch: React.Dispatch<AsyncDebugAction>; // why: Function to dispatch actions to the reducer. usedby: AsyncDebugContextProps
  eventEmitter: EventEmitter;
}

// why: Create a context for async debugging. usedby: AsyncDebugProvider, useAsyncDebug
const AsyncDebugContext = createContext<AsyncDebugContextProps | undefined>(undefined);

class EventEmitter {
  private listeners: Map<string, Set<Function>>;

  constructor() {
    this.listeners = new Map();
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

// why: Provider component to supply state and dispatch to its children. usedby: Application components
export const AsyncDebugProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // why: Use reducer to manage state and provide dispatch function. usedby: AsyncDebugProvider
  const [state, dispatch] = useReducer(asyncDebugReducer, initialState);
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    eventEmitter
  }), [state, eventEmitter]);

  // why: Provide state and dispatch to children components. usedby: AsyncDebugProvider
  return (
    <AsyncDebugContext.Provider value={contextValue}>
      {children}
    </AsyncDebugContext.Provider>
  );
};

// why: Hook to access async debug context within components. usedby: Application components
export const useAsyncDebug = (): AsyncDebugContextProps => {
  // why: Retrieve context value for state and dispatch. usedby: useAsyncDebug
  const context = useContext(AsyncDebugContext);
  // why: Ensure hook is used within a provider, throw error if not. usedby: useAsyncDebug
  if (!context) {
    throw new Error('useAsyncDebug must be used within an AsyncDebugProvider');
  }
  return context; // why: Return context value for use in components. usedby: useAsyncDebug
}; 
