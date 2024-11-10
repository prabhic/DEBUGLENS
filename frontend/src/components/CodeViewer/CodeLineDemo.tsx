import React from 'react';

interface CodeLineProps {
  number: number;
  content: string;
  hasBreakpoint?: boolean;
  onToggleBreakpoint?: (lineNumber: number) => void;
}

// CodeLine component
const CodeLine: React.FC<CodeLineProps> = ({ 
  number, 
  content, 
  hasBreakpoint = false, 
  onToggleBreakpoint = () => {} 
}) => {
  return (
    <div
      className="flex w-full hover:bg-gray-800/30 cursor-pointer items-center"
      onClick={() => onToggleBreakpoint(number)}
      style={{ fontFamily: 'monospace' }}
    >
      {/* Fixed-width left section for line number and breakpoint */}
      <div className="flex-none w-[88px] flex items-center">
        {/* Breakpoint area */}
        <div className="w-10 flex items-center justify-center">
          {hasBreakpoint && (
            <div className="w-2 h-2 bg-red-400 rounded-full" />
          )}
        </div>
        
        {/* Line number */}
        <div className="w-12 text-gray-400 text-right pr-4 select-none">
          {number}
        </div>
      </div>

      {/* Code content with proper text handling */}
      <div
        className={`flex-1 py-1 ${hasBreakpoint ? 'bg-red-800/40' : ''}`}
      >
        <code className="block text-white">{content}</code>
      </div>
    </div>
  );
};

// Demo component to show the CodeLine in action
export const CodeLineDemo = () => {
  const [breakpoints, setBreakpoints] = React.useState<Set<number>>(new Set());

  const toggleBreakpoint = (lineNumber: number) => {
    setBreakpoints(prev => {
      const newBreakpoints = new Set(prev);
      if (newBreakpoints.has(lineNumber)) {
        newBreakpoints.delete(lineNumber);
      } else {
        newBreakpoints.add(lineNumber);
      }
      return newBreakpoints;
    });
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg w-full">
      <CodeLine
        number={1}
        content='repo = Repository("my_repo") # Initialize the repository'
        hasBreakpoint={breakpoints.has(1)}
        onToggleBreakpoint={toggleBreakpoint}
      />
    </div>
  );
};
