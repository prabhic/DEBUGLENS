import React, { FC } from 'react';
import { Play, Square, SkipForward, FastForward, XCircle } from 'lucide-react';

interface StandardDebugToolbarProps {
  isDebugging: boolean;
  isPaused: boolean;
  hasBreakpoints: boolean;
  currentStep: string | null;
  onStartDebugging: () => void;
  onStopDebugging: () => void;
  onStepOver: () => void;
  onContinue: () => void;
  onClearBreakpoints: () => void;
  isLoadingNextStep?: boolean;
}

export const StandardDebugToolbar: FC<StandardDebugToolbarProps> = ({
  isDebugging,
  isPaused,
  hasBreakpoints,
  currentStep,
  onStartDebugging,
  onStopDebugging,
  onStepOver,
  onContinue,
  onClearBreakpoints,
  isLoadingNextStep = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Start/Continue Debugging (F5) */}
      {!isDebugging ? (
        <button
          onClick={onStartDebugging}
          className="debug-button text-green-400"
          title="Start Debugging (F5)"
          disabled={!hasBreakpoints}
        >
          <Play className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={onContinue}
          className="debug-button text-blue-400"
          title="Continue (F5)"
          disabled={!isPaused || isLoadingNextStep}
        >
          <FastForward className="w-5 h-5" />
        </button>
      )}

      {/* Step Over (F10) */}
      <button
        onClick={onStepOver}
        className="debug-button text-blue-400"
        title="Step Over (F10)"
        disabled={!isDebugging || !isPaused || isLoadingNextStep}
      >
        <SkipForward className="w-5 h-5" />
      </button>

      {/* Stop Debugging (Shift+F5) */}
      <button
        onClick={onStopDebugging}
        className="debug-button text-red-400"
        title="Stop Debugging (Shift+F5)"
        disabled={!isDebugging}
      >
        <Square className="w-5 h-5" />
      </button>

      {/* Clear Breakpoints */}
      {hasBreakpoints && (
        <button
          onClick={onClearBreakpoints}
          className="debug-button text-gray-400"
          title="Clear All Breakpoints"
        >
          <XCircle className="w-5 h-5" />
        </button>
      )}

      {/* Status Indicator */}
      <div className="ml-4 text-sm">
        {isLoadingNextStep ? (
          <span className="text-blue-400">Loading next step...</span>
        ) : isDebugging ? (
          <span className="text-green-400">
            {isPaused ? 'Paused' : 'Running'} at step {currentStep}
          </span>
        ) : (
          <span className="text-gray-400">Ready to debug</span>
        )}
      </div>

      <style jsx>{`
        .debug-button {
          @apply p-2 rounded-lg hover:bg-gray-700/50 transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent;
        }
      `}</style>
    </div>
  );
}; 