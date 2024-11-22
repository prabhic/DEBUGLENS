import React, { createContext, useContext, useReducer, useEffect, useRef, useMemo } from 'react';

export interface InstantDebugState {
  activeStep: string | null;
  stepOrder: string[];
  steps: Record<string, {
    status: 'generating' | 'ready' | 'error';
    order?: number;
    name: string;
    code: {
      initial: string[];
      enhanced?: string[];
    };
    variables: {
      current: Record<string, any>;
      history: Array<{
        timestamp: number;
        changes: Record<string, any>;
      }>;
      before?: {
        name: string;
        state: string;
        values: string[];
      };
      after?: {
        name: string;
        state: string;
        values: string[];
      };
      changes?: string[];
    };
    concepts: {
      quick: string;
      detailed?: {
        title: string;
        explanation: string[];
        impact: string;
      };
    };
  }>;
  metadata: {
    generationStart?: number;
    lastUpdate?: number;
    completionStatus: 'initializing' | 'generating' | 'enhancing' | 'complete' | 'ready_for_details';
  };
}

interface InstantDebugAction {
  type: 
    | 'INIT_STEP' 
    | 'UPDATE_CODE' 
    | 'UPDATE_VARIABLES' 
    | 'UPDATE_CONCEPTS' 
    | 'SET_ACTIVE_STEP' 
    | 'UPDATE_STATUS'
    | 'UPDATE_STEP'
    | 'ADD_IMPLEMENTATION_STEP'
    | 'RESET';
  payload: any;
}

const initialState: InstantDebugState = {
  activeStep: null,
  stepOrder: [],
  steps: {},
  metadata: {
    completionStatus: 'initializing'
  }
};

const InstantDebugContext = createContext<{
  state: InstantDebugState;
  dispatch: React.Dispatch<InstantDebugAction>;
  startInstantDebug: (prompt: string) => Promise<void>;
  stepTo: (stepId: string) => Promise<void>;
  isPaused: boolean;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
} | undefined>(undefined);

export function InstantDebugProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(instantDebugReducer, initialState);
  const eventSourceRef = useRef<EventSource | null>(null);
  const activeRequestRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const [isPaused, setIsPaused] = React.useState(true);

  useEffect(() => {
    // Handle initial step loading
    if (state.metadata.completionStatus === 'ready_for_details') {
      const firstStepId = state.stepOrder[0];
      
      console.log('[Debug] Ready for details, setting active step:', {
        firstStepId,
        currentActive: state.activeStep,
        hasVariables: !!state.steps[firstStepId]?.variables?.before
      });

      // Set active step first
      dispatch({ 
        type: 'SET_ACTIVE_STEP', 
        payload: { stepId: firstStepId } 
      });
    }
  }, [state.metadata.completionStatus]);

  // Separate effect to handle step details loading
  useEffect(() => {
    const activeStepId = state.activeStep;
    if (!activeStepId) return;

    const activeStep = state.steps[activeStepId];
    // Only load if we don't have variables data and not in error state
    const needsDetails = !activeStep?.variables?.before && activeStep?.status !== 'error';

    console.log('[Debug] Checking step details:', {
      activeStepId,
      hasStep: !!activeStep,
      needsDetails,
      hasVariables: !!activeStep?.variables?.before,
      status: activeStep?.status
    });

    if (needsDetails && activeStep) {
      console.log('[Debug] Loading details for step:', activeStepId);
      stepTo(activeStepId, true); // Pass true to indicate this is an initial load
    }
  }, [state.activeStep]);

  useEffect(() => {
    // When debugging is active and not paused, automatically move to next step
    if (state.activeStep && !isPaused) {
      const currentIndex = state.stepOrder.indexOf(state.activeStep);
      if (currentIndex < state.stepOrder.length - 1) {
        const nextStepId = state.stepOrder[currentIndex + 1];
        const timer = setTimeout(() => {
          stepTo(nextStepId);
        }, 1000); // 1 second delay between steps
        return () => clearTimeout(timer);
      }
    }
  }, [state.activeStep, isPaused]);

  const startInstantDebug = async (prompt: string): Promise<void> => {
    if (isInitializedRef.current && activeRequestRef.current === prompt) {
      console.log('[Debug] Skipping duplicate initialization');
      return;
    }

    console.log('[Debug] Starting instant debug:', { prompt });
    isInitializedRef.current = true;
    activeRequestRef.current = prompt;

    try {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      dispatch({ type: 'INIT_STEP', payload: { status: 'initializing' } });

      const url = `/api/instant-debug/stream?prompt=${encodeURIComponent(prompt)}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[Debug] EventSource connection opened');
      };

      eventSource.onmessage = (event) => {
        console.log('[Debug] Received message:', event.data);
        try {
          const update = JSON.parse(event.data);
          dispatch({ type: update.type, payload: update.payload });
        } catch (error) {
          console.error('[Debug] Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[Debug] SSE Error:', error);
        eventSource.close();
        eventSourceRef.current = null;
        activeRequestRef.current = null;
        dispatch({ 
          type: 'UPDATE_STATUS', 
          payload: { status: 'error', error: 'Connection failed' } 
        });
      };

    } catch (error) {
      console.error('[Debug] Error in startInstantDebug:', error);
      throw error;
    }
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        activeRequestRef.current = null;
      }
    };
  }, []);

  const stepTo = async (stepId: string, isInitialLoad = false) => {
    console.log('[Debug] Stepping to:', {
      stepId,
      isInitialLoad,
      hasExistingData: !!state.steps[stepId]?.variables?.before
    });
    
    try {
      // First, update the active step
      dispatch({ 
        type: 'SET_ACTIVE_STEP', 
        payload: { stepId } 
      });

      // If we already have data and this isn't an initial load, skip the API call
      if (!isInitialLoad && state.steps[stepId]?.variables?.before) {
        console.log('[Debug] Using cached step data:', stepId);
        return;
      }

      // Set loading state
      dispatch({
        type: 'UPDATE_STEP',
        payload: {
          stepId,
          status: 'generating',
          variables: {
            before: {
              name: stepId,
              state: 'Loading...',
              values: ['Fetching state...']
            },
            after: {
              name: stepId,
              state: 'Loading...',
              values: ['Fetching state...']
            },
            changes: ['Loading changes...']
          }
        }
      });

      const response = await fetch('/api/instant-debug/step-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          stepId,
          prompt: activeRequestRef.current,
          stepData: state.steps[stepId]
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch step details: ${response.status}`);
      }

      const rawData = await response.json();
      console.log('[Debug] Raw step details response:', {
        stepId,
        rawData: JSON.stringify(rawData, null, 2)
      });

      // Parse the response data which might be a string or already parsed
      let parsedData;
      try {
        // If it's a string, parse it
        if (typeof rawData.messageContent === 'string') {
          parsedData = JSON.parse(rawData.messageContent);
        } else {
          parsedData = rawData;
        }
        console.log('[Debug] Parsed response data:', parsedData);
      } catch (parseError) {
        console.error('[Debug] Error parsing response:', parseError);
        throw new Error('Invalid response format');
      }

      // Extract variables from either format
      const variables = parsedData.stepDetails?.dataStructures || 
                       parsedData.payload?.variables;

      if (!variables) {
        console.error('[Debug] No variables found in response:', parsedData);
        throw new Error('No variables found in response');
      }

      // Parse the variables if it's a string
      const parsedVariables = typeof variables === 'string' ? JSON.parse(variables) : variables;

      console.log('[Debug] Extracted variables:', {
        stepId,
        variables: parsedVariables
      });

      // Update step with extracted data
      dispatch({
        type: 'UPDATE_STEP',
        payload: {
          stepId,
          status: 'ready',
          variables: parsedVariables
        }
      });

    } catch (error) {
      console.error('[Debug] Error fetching step details:', error);
      dispatch({
        type: 'UPDATE_STEP',
        payload: {
          stepId,
          status: 'error',
          variables: {
            before: {
              name: stepId,
              state: 'Error State',
              values: ['Failed to load state']
            },
            after: {
              name: stepId,
              state: 'Error State',
              values: ['Failed to load state']
            },
            changes: ['Error loading changes']
          },
          error: error instanceof Error ? error.message : 'Failed to load step details'
        }
      });
    }
  };

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    startInstantDebug,
    stepTo,
    isPaused,
    setIsPaused
  }), [state, dispatch, startInstantDebug, stepTo, isPaused]);

  return (
    <InstantDebugContext.Provider value={contextValue}>
      {children}
    </InstantDebugContext.Provider>
  );
}

export const useInstantDebug = () => {
  const context = useContext(InstantDebugContext);
  if (!context) {
    throw new Error('useInstantDebug must be used within an InstantDebugProvider');
  }
  return context;
};

function instantDebugReducer(state: InstantDebugState, action: InstantDebugAction): InstantDebugState {
  switch (action.type) {
    case 'INIT_STEP':
      return {
        ...state,
        metadata: {
          ...state.metadata,
          generationStart: Date.now(),
          completionStatus: 'initializing'
        }
      };
      
    case 'SET_ACTIVE_STEP':
      return {
        ...state,
        activeStep: action.payload.stepId
      };
      
    case 'UPDATE_CODE':
      return {
        ...state,
        steps: {
          ...state.steps,
          [action.payload.stepId]: {
            ...state.steps[action.payload.stepId],
            status: 'ready',
            code: {
              ...state.steps[action.payload.stepId]?.code,
              initial: action.payload.code,
            },
            variables: {
              ...state.steps[action.payload.stepId]?.variables,
              current: action.payload.variables?.current || {},
              history: action.payload.variables?.history || []
            },
            concepts: {
              ...state.steps[action.payload.stepId]?.concepts,
              quick: action.payload.concepts?.quick || '',
              detailed: action.payload.concepts?.detailed
            }
          }
        }
      };
      
    case 'UPDATE_STATUS':
      const newState = {
        ...state,
        metadata: {
          ...state.metadata,
          completionStatus: action.payload.status,
          lastUpdate: Date.now(),
          ...(action.payload.stepsCount && { totalSteps: action.payload.stepsCount })
        }
      };

      if (
        action.payload.status === 'ready_for_details' &&
        state.stepOrder.length > 0 &&
        !state.activeStep
      ) {
        return {
          ...newState,
          activeStep: state.stepOrder[0]
        };
      }

      return newState;
      
    case 'ADD_IMPLEMENTATION_STEP':
      return {
        ...state,
        stepOrder: [...state.stepOrder, action.payload.stepId],
        steps: {
          ...state.steps,
          [action.payload.stepId]: {
            status: 'ready',
            order: state.stepOrder.length,
            name: action.payload.name,
            code: {
              initial: action.payload.code,
              enhanced: undefined
            },
            variables: {
              current: {},
              history: []
            },
            concepts: {
              quick: action.payload.concepts.quick,
              detailed: action.payload.concepts.detailed
            }
          }
        },
        activeStep: state.activeStep || action.payload.stepId
      };
      
    case 'UPDATE_STEP':
      return {
        ...state,
        steps: {
          ...state.steps,
          [action.payload.stepId]: {
            ...state.steps[action.payload.stepId],
            status: action.payload.status,
            variables: action.payload.variables,
            ...(action.payload.error && { error: action.payload.error })
          }
        }
      };
      
    case 'RESET':
      return initialState;
      
    default:
      return state;
  }
} 