import React, { FC } from 'react';
import { Play, Square, ArrowRight, CornerDownRight, XCircle } from 'lucide-react';

interface DebugToolbarProps {
  isDebugging: boolean;
  isPaused: boolean;
  hasBreakpoints: boolean;
  onStartDebugging: () => void;
  onStopDebugging: () => void;
  onContinue: () => void;
  onStepOver: () => void;
  onClearBreakpoints: () => void;
  tooltips?: {
    start?: string;
    stop?: string;
    continue?: string;
    stepOver?: string;
  };
}

export const DebugToolbar: FC<DebugToolbarProps> = ({
  isDebugging,
  isPaused,
  hasBreakpoints,
  onStartDebugging,
  onStopDebugging,
  onContinue,
  onStepOver,
  onClearBreakpoints,
  tooltips = {}
}) => {
  return (
    <div className="flex items-center space-x-2">
      {!isDebugging ? (
        <button
          onClick={onStartDebugging}
          disabled={!hasBreakpoints}
          className="p-1.5 rounded hover:bg-gray-700 text-green-400 disabled:text-gray-600 disabled:hover:bg-transparent"
          title={tooltips.start || "Start Debugging"}
        >
          <Play size={20} />
        </button>
      ) : (
        <>
          <button
            onClick={onStopDebugging}
            className="p-1.5 rounded hover:bg-gray-700 text-red-400"
            title={tooltips.stop || "Stop Debugging"}
          >
            <Square size={20} />
          </button>
          <button
            onClick={onContinue}
            disabled={!isPaused}
            className="p-1.5 rounded hover:bg-gray-700 text-blue-400 disabled:text-gray-600 disabled:hover:bg-transparent"
            title={tooltips.continue || "Continue"}
          >
            <Play size={20} />
          </button>
          <button
            onClick={onStepOver}
            disabled={!isPaused}
            className="p-1.5 rounded hover:bg-gray-700 text-blue-400 disabled:text-gray-600 disabled:hover:bg-transparent"
            title={tooltips.stepOver || "Step Over"}
          >
            <CornerDownRight size={20} />
          </button>
        </>
      )}
      {hasBreakpoints && (
        <button
          onClick={onClearBreakpoints}
          className="p-1.5 rounded hover:bg-gray-700 text-gray-400"
          title="Clear All Breakpoints"
        >
          <XCircle size={20} />
        </button>
      )}
    </div>
  );
}; 