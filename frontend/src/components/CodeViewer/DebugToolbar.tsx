import React, { FC } from 'react';
import { Play, Square, SkipForward, FastForward, XCircle } from 'lucide-react';

interface DebugToolbarProps {
  isDebugging: boolean;
  isPaused: boolean;
  hasBreakpoints: boolean;
  onStartDebugging: () => void;
  onStopDebugging: () => void;
  onContinue: () => void;
  onStepOver: () => void;
  onClearBreakpoints: () => void;
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
}) => {
  return (
    <div className="flex items-center space-x-2">
      {!isDebugging ? (
        <button
          onClick={onStartDebugging}
          disabled={!hasBreakpoints}
          className="p-1.5 rounded hover:bg-gray-700 text-green-400 disabled:text-gray-600 disabled:hover:bg-transparent"
          title="Start Debugging (F5)"
        >
          <Play size={20} />
        </button>
      ) : (
        <>
          <button
            onClick={onStopDebugging}
            className="p-1.5 rounded hover:bg-gray-700 text-red-400"
            title="Stop Debugging (Shift+F5)"
          >
            <Square size={20} />
          </button>
          <button
            onClick={onContinue}
            disabled={!isPaused}
            className="p-1.5 rounded hover:bg-gray-700 text-blue-400 disabled:text-gray-600 disabled:hover:bg-transparent"
            title="Continue (F8)"
          >
            <FastForward size={20} />
          </button>
          <button
            onClick={onStepOver}
            disabled={!isPaused}
            className="p-1.5 rounded hover:bg-gray-700 text-blue-400 disabled:text-gray-600 disabled:hover:bg-transparent"
            title="Step Over (F10)"
          >
            <SkipForward size={20} />
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