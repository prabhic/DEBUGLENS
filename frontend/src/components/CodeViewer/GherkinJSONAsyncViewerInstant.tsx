import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useInstantDebug } from '@/contexts/InstantDebugContext';
import { DebugToolbar } from './DebugToolbar';
import { DebugLensIcon } from '@/components/Icons/DebugLensIcon';
import type { InstantDebugState } from '@/contexts/InstantDebugContext';
import { InstantVariablePanel } from './InstantVariablePanel';

interface GherkinJSONAsyncViewerInstantProps {
  prompt: string;
  onReset: () => void;
  onOpenAIChat: () => void;
}

const VariablePanelLoader = () => (
  <div className="p-4 space-y-4">
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      <div className="h-4 bg-gray-700 rounded w-2/3"></div>
    </div>
  </div>
);

export const GherkinJSONAsyncViewerInstant: React.FC<GherkinJSONAsyncViewerInstantProps> = ({
  prompt,
  onReset,
  onOpenAIChat
}) => {
  const { state, startInstantDebug, stepTo } = useInstantDebug();
  const [isDebugging, setIsDebugging] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const promptRef = useRef(prompt);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!prompt || isInitializedRef.current) return;
    
    console.log('[Debug] Initializing component with prompt:', prompt);
    isInitializedRef.current = true;
    
    const initDebug = async () => {
      try {
        await startInstantDebug(prompt);
      } catch (error) {
        console.error('[Debug] Error starting debug:', error);
      }
    };

    initDebug();

    return () => {
      console.log('[Debug] Component cleanup');
    };
  }, [prompt, startInstantDebug]);

  const handleStepClick = async (stepId: string) => {
    console.log('[Debug] Step clicked:', {
      clickedStep: stepId,
      currentActive: state.activeStep
    });

    // Don't reload if it's already the active step and has data
    if (stepId === state.activeStep && state.steps[stepId]?.variables?.before) {
      console.log('[Debug] Step already active with data, skipping reload');
      return;
    }

    try {
      // Load step details
      await stepTo(stepId);
    } catch (error) {
      console.error('[Debug] Error loading step details:', error);
    }
  };

  // Add function to handle debug navigation
  const handleStartDebugging = useCallback(() => {
    setIsDebugging(true);
    setIsPaused(true);
    // Navigate to first step if available
    if (state.stepOrder.length > 0) {
      stepTo(state.stepOrder[0]);
    }
  }, [state.stepOrder, stepTo]);

  const handleStopDebugging = useCallback(() => {
    setIsDebugging(false);
    setIsPaused(true);
  }, []);

  const handleStepOver = useCallback(() => {
    if (!state.activeStep || !isDebugging) return;
    
    const currentIndex = state.stepOrder.indexOf(state.activeStep);
    if (currentIndex < state.stepOrder.length - 1) {
      stepTo(state.stepOrder[currentIndex + 1]);
    }
  }, [state.activeStep, state.stepOrder, stepTo, isDebugging]);

  const handleContinue = useCallback(() => {
    setIsPaused(false);
    handleStepOver();
  }, [handleStepOver]);

  // Add keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for these keys
      if (event.key === 'F5' || event.key === 'F10') {
        event.preventDefault();
      }

      // F5 - Start/Continue Debugging
      if (event.key === 'F5') {
        if (!isDebugging) {
          handleStartDebugging();
        } else if (isPaused) {
          handleContinue();
        }
      }

      // F10 - Step Over
      if (event.key === 'F10') {
        if (isDebugging && isPaused) {
          handleStepOver();
        }
      }

      // Shift + F5 - Stop Debugging
      if (event.key === 'F5' && event.shiftKey) {
        if (isDebugging) {
          handleStopDebugging();
        }
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDebugging, isPaused, handleStartDebugging, handleContinue, handleStepOver, handleStopDebugging]);

  // Loading state
  if (state.metadata.completionStatus === 'initializing') {
    return (
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex-none bg-gray-900 border-b border-gray-700">
          <div className="flex items-center h-12 px-4">
            <DebugLensIcon className="w-5 h-5" />
            <span className="text-white font-medium ml-3">Initializing Debug Session...</span>
          </div>
        </div>

        {/* Loading Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <div className="text-gray-400">Preparing instant debug session...</div>
          </div>
        </div>
      </div>
    );
  }

  // Get ordered steps
  const orderedSteps = state.stepOrder
    .map(stepId => ({
      stepId,
      step: state.steps[stepId]
    }))
    .filter(({ step }) => step); // Filter out any undefined steps

  return (
    <div className="h-screen flex flex-col">
      {/* Header with Debug Controls */}
      <div className="flex-none bg-gray-900 border-b border-gray-700">
        <div className="flex items-center h-12">
          <div className="w-64 flex items-center px-4">
            <button onClick={onReset} className="flex items-center hover:opacity-80 transition-opacity">
              <DebugLensIcon className="w-5 h-5" />
              <span className="text-white font-medium ml-3">DebugLens</span>
            </button>
          </div>
          
          <div className="flex-1 px-4 flex items-center justify-between">
            <DebugToolbar
              isDebugging={isDebugging}
              isPaused={isPaused}
              hasBreakpoints={state.stepOrder.length > 0}
              onStartDebugging={handleStartDebugging}
              onStopDebugging={handleStopDebugging}
              onContinue={handleContinue}
              onStepOver={handleStepOver}
              onClearBreakpoints={() => {}}
              tooltips={{
                start: "Start Debugging (F5)",
                stop: "Stop Debugging (Shift+F5)",
                continue: "Continue (F5)",
                stepOver: "Step Over (F10)"
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Scenario Overview */}
        <div className="w-64 flex-none border-r border-gray-700 bg-gray-900 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Current Scenario</h3>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-blue-400 font-medium">Implementation Analysis</div>
              <div className="text-sm text-gray-400 mt-1">{prompt}</div>
              {state.metadata.completionStatus === 'generating' && (
                <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Analyzing implementation...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Panel - Implementation Steps */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {orderedSteps.map(({ stepId, step }) => (
                <div 
                  key={stepId}
                  className={`bg-gray-800 rounded-lg p-4 border-l-4 transition-colors ${
                    state.activeStep === stepId ? 'border-blue-500' : 'border-gray-700'
                  }`}
                  onClick={() => handleStepClick(stepId)}
                >
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-blue-400">
                      {stepId === 'overview' ? 'Implementation Overview' : step.concepts.quick}
                    </h4>
                    {step.status === 'generating' && (
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        Analyzing...
                      </div>
                    )}
                  </div>

                  {/* Code Block */}
                  <div className="font-mono bg-gray-900/50 rounded-lg overflow-hidden mb-3">
                    {/* Code Header */}
                    <div className="bg-gray-800/50 px-3 py-1.5 border-b border-gray-700/50 flex items-center justify-between">
                      <div className="text-xs text-gray-400">Implementation</div>
                    </div>
                    {/* Code Content */}
                    <div className="overflow-x-auto">
                      {step.code.initial.map((line, index) => (
                        <div key={index} className="flex hover:bg-gray-800/30">
                          {/* Line Number */}
                          <div className="text-xs text-gray-600 select-none w-[3rem] px-3 text-right border-r border-gray-700/50 py-[3px]">
                            {index + 1}
                          </div>
                          {/* Code Line */}
                          <div className="text-gray-300 flex-1 px-4 py-[3px]">
                            <pre className="text-xs font-mono whitespace-pre">{line}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Implementation Details */}
                  {step.concepts.detailed && (
                    <div className="text-sm text-gray-400 space-y-2 mt-4 bg-gray-900/30 rounded-lg p-3">
                      {step.concepts.detailed.explanation.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-blue-400">•</span>
                          <span>{point}</span>
                        </div>
                      ))}
                      <div className="text-green-400 mt-2 pl-4">
                        {step.concepts.detailed.impact}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {state.metadata.completionStatus === 'generating' && (
                <div className="text-center text-gray-500 py-4">
                  Analyzing more implementation details...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Variables & Details */}
        {state.activeStep && (
          <div className="w-80 flex-none border-l border-gray-700 bg-gray-900 overflow-hidden">
            {state.steps[state.activeStep]?.variables?.before ? (
              <InstantVariablePanel 
                variables={{
                  before: state.steps[state.activeStep].variables.before,
                  after: state.steps[state.activeStep].variables.after,
                  changes: state.steps[state.activeStep].variables.changes
                }}
                isLoading={state.steps[state.activeStep].status === 'generating'}
              />
            ) : (
              <VariablePanelLoader />
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 