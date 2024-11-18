// why: Import necessary React hooks and types for context and state management. usedby: AsyncDebugProvider, useAsyncDebug
import React, { createContext, useContext, useReducer, ReactNode, useMemo, useState, useEffect } from 'react';
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
  | { type: 'LOAD_FAILURE'; stepId: string; error: string } // why: Action to mark a step as failed with an error. usedby: asyncDebugReducer
  | { type: 'RESET' }; // why: Action to reset the state. usedby: asyncDebugReducer

// why: Initialize the initial state with no debug steps. usedby: useReducer
const initialState: AsyncDebugState = {
  steps: {}, // why: Start with an empty record of steps. usedby: initialState
};

// why: Reducer function to handle state transitions based on actions. usedby: useReducer
const asyncDebugReducer = (state: AsyncDebugState, action: AsyncDebugAction): AsyncDebugState => {
  console.log('[AsyncDebugReducer] Processing action:', { 
    type: action.type, 
    stepId: action.stepId 
  });

  switch (action.type) {
    case 'START_LOADING':
      console.log('[AsyncDebugReducer] Starting load for step:', {
        stepId: action.stepId,
        existingStatus: state.steps[action.stepId]?.status
      });
      return {
        ...state,
        steps: {
          ...state.steps,
          [action.stepId]: { status: 'loading' },
        },
      };
    case 'LOAD_SUCCESS':
      console.log('[AsyncDebugReducer] Load success for step:', {
        stepId: action.stepId,
        dataKeys: Object.keys(action.data)
      });
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
      console.error('[AsyncDebugReducer] Load failure for step:', {
        stepId: action.stepId,
        error: action.error
      });
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
    case 'RESET':
      console.log('[AsyncDebugReducer] Resetting state');
      return {
        ...initialState
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
  isAsyncMode: boolean;
  setIsAsyncMode: (value: boolean) => void;
}

// why: Create a context for async debugging. usedby: AsyncDebugProvider, useAsyncDebug
const AsyncDebugContext = createContext<AsyncDebugContextProps | undefined>(undefined);

class EventEmitter {
  private listeners: Map<string, Set<Function>>;

  constructor() {
    this.listeners = new Map();
    console.log('[EventEmitter] Initialized');
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    console.log('[EventEmitter] Added listener for:', event);
  }

  off(event: string, callback: Function) {
    console.log('[EventEmitter] Removing listener for:', event);
    this.listeners.get(event)?.delete(callback);
    // Clean up empty sets
    if (this.listeners.get(event)?.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit(event: string, data: any) {
    console.log('[EventEmitter] Emitting event:', event, data);
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

// why: Provider component to supply state and dispatch to its children. usedby: Application components
interface AsyncDebugProviderProps {
  children: React.ReactNode;
  isAsyncMode?: boolean;
}

export const AsyncDebugProvider: FC<AsyncDebugProviderProps> = ({ 
  children,
  isAsyncMode: propIsAsyncMode = false 
}) => {
  const [isAsyncMode, setIsAsyncMode] = useState(propIsAsyncMode);
  const [state, dispatch] = useReducer(asyncDebugReducer, initialState);
  const eventEmitter = useMemo(() => new EventEmitter(), []);

  useEffect(() => {
    setIsAsyncMode(propIsAsyncMode);
  }, [propIsAsyncMode]);

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    eventEmitter,
    isAsyncMode,
    setIsAsyncMode
  }), [state, eventEmitter, isAsyncMode]);

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
