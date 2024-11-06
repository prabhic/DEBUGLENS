import React, { FC } from 'react';

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
    <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
      {/* Start/Stop Debug button */}
      <button
        className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 ${
          isDebugging
            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200'
            : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200'
        }`}
        onClick={isDebugging ? onStopDebugging : onStartDebugging}
        disabled={!hasBreakpoints}
      >
        <span>{isDebugging ? 'Stop' : 'Start'} Debugging</span>
        <kbd className="px-1.5 py-0.5 text-xs bg-black/20 rounded">
          {isDebugging ? 'Shift+F5' : 'F5'}
        </kbd>
      </button>

      {/* Continue button - only show while debugging and paused */}
      {isDebugging && isPaused && (
        <button
          className="px-3 py-1.5 rounded text-sm font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 flex items-center gap-2"
          onClick={onContinue}
        >
          <span>Continue</span>
          <kbd className="px-1.5 py-0.5 text-xs bg-black/20 rounded">F5</kbd>
        </button>
      )}

      {/* Step Over button - only show while debugging and paused */}
      {isDebugging && isPaused && (
        <button
          className="px-3 py-1.5 rounded text-sm font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 flex items-center gap-2"
          onClick={onStepOver}
        >
          <span>Step Over</span>
          <kbd className="px-1.5 py-0.5 text-xs bg-black/20 rounded">F10</kbd>
        </button>
      )}

      {/* Clear Breakpoints button */}
      <button
        className="px-3 py-1.5 rounded text-sm font-medium bg-gray-600/30 hover:bg-gray-600/40 text-gray-300 flex items-center gap-2"
        onClick={onClearBreakpoints}
        disabled={isDebugging}
      >
        <span>Clear Breakpoints</span>
      </button>

      {/* Debugging status indicator */}
      {isDebugging && (
        <div className="ml-2 flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${
            isPaused 
              ? 'bg-yellow-400/70' 
              : 'bg-emerald-400/70 animate-pulse'
          }`} />
          <span className="text-gray-400">
            {isPaused ? 'Paused' : 'Running'}
          </span>
        </div>
      )}
    </div>
  );
}; 