import React, { FC } from 'react';

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

interface CodeLineProps {
  number: number;
  content: string;
  hasBreakpoint: boolean;
  isCurrentLine: boolean;
  onToggleBreakpoint: (lineNumber: number) => Promise<void>;
  indentLevel?: number;
}

export const CodeLine: FC<CodeLineProps> = ({ 
  number, 
  content, 
  hasBreakpoint, 
  isCurrentLine, 
  onToggleBreakpoint,
  indentLevel = 0 
}) => {
  const paddingLeft = indentLevel * 24;

  return (
    <div 
      className={`flex hover:bg-gray-800/30 cursor-pointer items-center relative
        ${isCurrentLine ? 'bg-blue-500/20' : ''}
        ${hasBreakpoint ? 'bg-red-800/10' : ''}`}
      onClick={async () => {
        await onToggleBreakpoint(number);
      }}
      style={{ fontFamily: MONO_FONT }}
    >
      {/* Fixed-width section for line number and breakpoint */}
      <div className="flex-none w-[88px] flex items-center relative">
        {isCurrentLine && (
          <div className="absolute left-0 text-blue-400">
            →
          </div>
        )}
        
        <div className="w-10 flex items-center justify-center">
          {hasBreakpoint && (
            <div className="w-3 h-3 bg-red-500 rounded-full" />
          )}
        </div>
        
        <div className="w-[48px] text-gray-400 text-right pr-4 select-none">
          {number}
        </div>
      </div>

      {/* Content section with proper scrolling */}
      <div 
        className="flex-1 py-1 min-w-0"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <code className={`block whitespace-pre ${getGherkinStyle(content)}`}>
          {content}
        </code>
      </div>
    </div>
  );
};

// Helper function to determine Gherkin line styling
const getGherkinStyle = (line: string): string => {
  if (line.startsWith('Feature:')) return 'text-purple-400 font-semibold';
  if (line.startsWith('Scenario:')) return 'text-blue-400 font-semibold';
  if (line.startsWith('  Given ')) return 'text-green-400';
  if (line.startsWith('  When ')) return 'text-yellow-400';
  if (line.startsWith('  Then ')) return 'text-orange-400';
  if (line.startsWith('  And ')) return 'text-gray-400';
  if (line.startsWith('  @')) return 'text-pink-400';
  if (line.includes('|')) return 'text-cyan-400';
  return 'text-gray-300';
}; 