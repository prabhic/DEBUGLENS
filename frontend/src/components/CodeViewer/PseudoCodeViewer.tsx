'use client'

import React, { useState, FC, useEffect } from 'react'
import { PseudoContent, PseudoSection, DebuggerState, VariableState } from '@/types/pseudo'
import { setBreakpoint } from '@/services/debugService';
import { ResizablePanel } from './ResizablePanel';
import { DebugToolbar } from './DebugToolbar';

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

// Add this constant for concepts mapping
const conceptsMap: Record<number, string> = {
  1: "Initialization: Setting up the initial state of the program",
  2: "Branch Creation: Creating a new branch in the repository",
  3: "Branch Modification: Updating branch properties",
  4: "Commit Creation: Creating a new commit in the branch",
  5: "Repository Operations: Performing operations on the repository",
};

interface LineProps {
  number: number;
  content: string;
  hasBreakpoint: boolean;
  isCurrentLine: boolean;
  onToggleBreakpoint: (lineNumber: number) => Promise<void>;
}

const CodeLine: FC<LineProps> = ({ number, content, hasBreakpoint, isCurrentLine, onToggleBreakpoint }) => {
  return (
    <div 
      className={`flex w-full hover:bg-gray-800/30 cursor-pointer items-center whitespace-nowrap relative
        ${isCurrentLine ? 'bg-blue-500/20' : ''}
        ${hasBreakpoint ? 'bg-red-800/10' : ''}`}
      onClick={async () => {
        console.log('CodeLine clicked:', number);
        await onToggleBreakpoint(number);
      }}
      style={{ fontFamily: MONO_FONT }}
    >
      {/* Fixed-width left section for line number and breakpoint */}
      <div className="flex-none w-[88px] flex items-center relative">
        {/* Arrow marker before line number */}
        {isCurrentLine && (
          <div className="absolute left-0 text-blue-400">
            →
          </div>
        )}
        
        {/* Breakpoint area */}
        <div className="w-10 flex items-center justify-center">
          {hasBreakpoint && (
            <div className="w-3 h-3 bg-red-500 rounded-full" />
          )}
        </div>
        
        {/* Line number */}
        <div className="w-[48px] text-gray-400 text-right pr-4 select-none">
          {number}
        </div>
      </div>

      {/* Code content with no wrapping */}
      <div className="flex-1 py-1 overflow-hidden">
        <code className="block whitespace-pre">
          {content}
        </code>
      </div>
    </div>
  );
}

interface VariablesPanelProps {
  variables: VariableState[];
}

const VariablesPanel: FC<VariablesPanelProps> = ({ variables }) => {
  if (variables.length === 0) return null;

  return (
    <div className="bg-gray-800 text-gray-100 rounded-lg border border-gray-700 overflow-hidden h-full">
      {/* Panel Header */}
      <div className="bg-gray-700 px-4 py-2 border-b border-gray-600">
        <h3 className="text-sm font-semibold text-white">Variables Watch</h3>
      </div>

      {/* Variables Table */}
      <div className="w-full">
        <table className="w-full text-sm">
          <thead className="bg-gray-700/50 border-b border-gray-600">
            <tr>
              <th className="text-left py-2 px-4 font-medium text-gray-300">Name</th>
              <th className="text-left py-2 px-4 font-medium text-gray-300">Value</th>
              <th className="text-left py-2 px-4 font-medium text-gray-300">Type</th>
            </tr>
          </thead>
          <tbody>
            {variables.map((variable, index) => (
              <tr 
                key={index}
                className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
              >
                <td className="py-2 px-4">
                  <span className="font-mono text-blue-300">{variable.name}</span>
                </td>
                <td className="py-2 px-4">
                  <span className="font-mono text-green-300 break-all">{variable.value}</span>
                </td>
                <td className="py-2 px-4">
                  <span className="text-gray-400">{variable.type}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface PseudoCodeViewerProps {
  initialContent: string;
  onReset: () => void;
  onOpenAIChat: () => void;
}

export const PseudoCodeViewer: FC<PseudoCodeViewerProps> = ({ initialContent, onReset, onOpenAIChat }) => {
  console.log('PseudoCodeViewer rendered at:', new Date().toISOString());
  
  const [pseudoContent, setPseudoContent] = useState<PseudoContent | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<string>('default')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [debuggerState, setDebuggerState] = useState<DebuggerState>({
    isDebugging: false,
    currentLine: null,
    breakpoints: new Set(),
    isPaused: false,
    variables: []
  });
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(300);
  const [bottomPanelHeight, setBottomPanelHeight] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight * 0.3 : 200
  );
  const [codeViewerWidth, setCodeViewerWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth - 550 : 800
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCodeViewerWidth(window.innerWidth * 0.6);
      
      const handleResize = () => {
        setCodeViewerWidth(prev => Math.min(prev, window.innerWidth * 0.8));
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default browser behavior for these keys
      if (['F5', 'F10'].includes(event.key)) {
        event.preventDefault();
      }

      // Only handle keyboard shortcuts if we have content loaded
      if (!pseudoContent) return;

      switch (event.key) {
        case 'F5':
          if (event.shiftKey) {
            // Shift+F5: Stop debugging
            if (debuggerState.isDebugging) {
              stopDebugging();
            }
          } else {
            // F5: Start debugging or continue to next breakpoint
            if (!debuggerState.isDebugging) {
              if (debuggerState.breakpoints.size > 0) {
                startDebugging();
              }
            } else if (debuggerState.isPaused) {
              continueToNextBreakpoint();
            }
          }
          break;
        case 'F10':
          if (debuggerState.isDebugging && debuggerState.isPaused) {
            stepNextLine();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    debuggerState.isDebugging, 
    debuggerState.isPaused, 
    debuggerState.breakpoints,
    pseudoContent
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Update bottom panel height when window resizes
      const handleResize = () => {
        setBottomPanelHeight(window.innerHeight * 0.3);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (initialContent) {
      const pseudoData: PseudoContent = {
        abstraction_levels: ['default'],
        sections: [{
          level: 'default',
          content: initialContent.split('\n')
        }]
      };
      setPseudoContent(pseudoData);
      setSelectedLevel('default');
    }
  }, [initialContent]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const file = event.target.files?.[0]
      if (!file) {
        setError('No file selected')
        return
      }

      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          console.log('File content loaded:', content.substring(0, 100) + '...');
          
          const pseudoData: PseudoContent = {
            abstraction_levels: ['default'],
            sections: [{
              level: 'default',
              content: content.split('\n')
            }]
          }
          
          setPseudoContent(pseudoData)
          setSelectedLevel('default')
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load pseudo file'
          setError(errorMessage)
          console.error('Error in file processing:', err)
        }
      }

      reader.onerror = (error) => {
        setError('Error reading file')
        console.error('FileReader error:', error)
      }

      reader.readAsText(file)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file'
      setError(errorMessage)
      console.error('Error in file upload:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleBreakpoint = async (lineNumber: number) => {
    console.log('Toggling breakpoint for line:', lineNumber);
    
    // Update local state first
    setDebuggerState(prev => {
      const newBreakpoints = new Set(prev.breakpoints);
      if (newBreakpoints.has(lineNumber)) {
        console.log('Removing breakpoint from line:', lineNumber);
        newBreakpoints.delete(lineNumber);
      } else {
        console.log('Adding breakpoint to line:', lineNumber);
        newBreakpoints.add(lineNumber);
      }
      console.log('Updated breakpoints:', Array.from(newBreakpoints));
      return { ...prev, breakpoints: newBreakpoints };
    });

    // Then call the API if enabled
    if (process.env.NEXT_PUBLIC_API_ENABLED === 'true') {
      try {
        console.log('Calling debug service for line:', lineNumber);
        const response = await setBreakpoint('dummy-file-id', lineNumber, selectedLevel);
        console.log('Debug service response:', response);
      } catch (error) {
        console.error('Error in toggleBreakpoint:', error);
      }
    }
  };

  const startDebugging = () => {
    const sortedBreakpoints = Array.from(debuggerState.breakpoints).sort((a, b) => a - b);
    console.log('Starting debugging with breakpoints:', sortedBreakpoints);
    
    if (sortedBreakpoints.length === 0) {
      setError('Please set at least one breakpoint before starting debugging');
      return;
    }
    
    const firstBreakpoint = sortedBreakpoints[0];
    console.log('Setting first breakpoint at line:', firstBreakpoint);
    
    // Add sample variables for demonstration
    const sampleVariables: VariableState[] = [
      { name: 'repo', value: 'Repository("my_repo")', type: 'Repository' },
      { name: 'current_branch', value: 'Branch("main")', type: 'Branch' },
      { name: 'commit1', value: 'Commit("001")', type: 'Commit' }
    ];
    
    setDebuggerState(prev => {
      const newState = {
        ...prev,
        isDebugging: true,
        isPaused: true,
        currentLine: firstBreakpoint,
        variables: sampleVariables // Add variables to state
      };
      console.log('New debugger state:', newState);
      return newState;
    });
  };

  const stopDebugging = () => {
    setDebuggerState(prev => ({
      ...prev,
      isDebugging: false,
      isPaused: false,
      currentLine: null,
      variables: [] // Clear variables when stopping
    }));
  };

  const stepNextLine = () => {
    if (!pseudoContent) return;
    
    const currentSection = pseudoContent.sections.find(
      section => section.level === selectedLevel
    ) || pseudoContent.sections[0];
    
    const totalLines = currentSection.content.length;
    
    setDebuggerState(prev => {
      if (prev.currentLine === null) return prev;
      
      const nextLine = prev.currentLine + 1;
      
      // Update variables based on the current line (sample logic)
      let updatedVariables = [...prev.variables];
      if (nextLine === 2) {
        updatedVariables = [
          ...updatedVariables,
          { name: 'main_branch', value: 'Branch("main")', type: 'Branch' }
        ];
      } else if (nextLine === 3) {
        updatedVariables = updatedVariables.map(v => 
          v.name === 'current_branch' 
            ? { ...v, value: 'Branch("main", head: null)' }
            : v
        );
      }
      
      // If we've reached the end of the file
      if (nextLine > totalLines) {
        return {
          ...prev,
          isDebugging: false,
          isPaused: false,
          currentLine: null,
          variables: []
        };
      }
      
      // If we've hit a breakpoint
      if (prev.breakpoints.has(nextLine)) {
        return {
          ...prev,
          currentLine: nextLine,
          isPaused: true,
          variables: updatedVariables
        };
      }
      
      // Regular step to next line
      return {
        ...prev,
        currentLine: nextLine,
        variables: updatedVariables
      };
    });
  };

  const continueToNextBreakpoint = () => {
    if (!pseudoContent) return;
    
    const currentSection = pseudoContent.sections.find(
      section => section.level === selectedLevel
    ) || pseudoContent.sections[0];
    
    const totalLines = currentSection.content.length;
    const sortedBreakpoints = Array.from(debuggerState.breakpoints)
      .sort((a, b) => a - b)
      .filter(bp => bp > (debuggerState.currentLine || 0));
    
    if (sortedBreakpoints.length === 0) {
      // No more breakpoints, run to end
      setDebuggerState(prev => ({
        ...prev,
        isDebugging: false,
        isPaused: false,
        currentLine: null
      }));
      return;
    }
    
    const nextBreakpoint = sortedBreakpoints[0];
    setDebuggerState(prev => ({
      ...prev,
      currentLine: nextBreakpoint,
      isPaused: true
    }));
  };

  const clearAllBreakpoints = async () => {
    // First update local state
    setDebuggerState(prev => ({
      ...prev,
      breakpoints: new Set()
    }));

    // Then notify the debug service if API is enabled
    if (process.env.NEXT_PUBLIC_API_ENABLED === 'true') {
      try {
        // Get all current breakpoints before clearing
        const breakpointsToRemove = Array.from(debuggerState.breakpoints);
        
        // Remove each breakpoint via the API
        for (const lineNumber of breakpointsToRemove) {
          await setBreakpoint('dummy-file-id', lineNumber, selectedLevel);
        }
        
        console.log('All breakpoints cleared on server');
      } catch (error) {
        console.error('Error clearing breakpoints:', error);
      }
    }
  };

  const renderContent = () => {
    if (!pseudoContent) return null;

    const currentSection = pseudoContent.sections.find(
      (section: PseudoSection) => section.level === selectedLevel
    ) || pseudoContent.sections[0];

    return (
      <div className="flex flex-col h-full relative">
        {/* Debug Toolbar */}
        <DebugToolbar
          isDebugging={debuggerState.isDebugging}
          isPaused={debuggerState.isPaused}
          hasBreakpoints={debuggerState.breakpoints.size > 0}
          onStartDebugging={startDebugging}
          onStopDebugging={stopDebugging}
          onContinue={continueToNextBreakpoint}
          onStepOver={stepNextLine}
          onClearBreakpoints={clearAllBreakpoints}
        />

        {/* Code content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full bg-gray-900 text-gray-100">
            <div className="overflow-x-auto h-full">
              <div className="min-w-full">
                {currentSection.content.map((line: string, index: number) => (
                  <CodeLine
                    key={index}
                    number={index + 1}
                    content={line}
                    hasBreakpoint={debuggerState.breakpoints.has(index + 1)}
                    isCurrentLine={debuggerState.currentLine === index + 1}
                    onToggleBreakpoint={toggleBreakpoint}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right panel for variables */}
        {debuggerState.isPaused && (
          <div 
            style={{ width: `${rightPanelWidth}px` }}
            className="h-full bg-gray-900 border-l border-gray-700 relative"
          >
            {/* Add horizontal drag handle */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1 bg-gray-700 cursor-ew-resize hover:bg-blue-500/50"
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = rightPanelWidth;

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const deltaX = startX - moveEvent.clientX;
                  const newWidth = startWidth + deltaX;
                  setRightPanelWidth(Math.max(250, Math.min(800, newWidth)));
                };

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />

            {/* Panel content */}
            <div className="h-full">
              <div className="bg-gray-800 px-4 py-2 font-medium text-sm">
                Variables
              </div>
              <div className="overflow-auto h-[calc(100%-2.5rem)]">
                <VariablesPanel variables={debuggerState.variables} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Top bar */}
      <div className="bg-gray-800 p-2 border-b border-gray-700">
        <input
          type="file"
          accept=".pseudo"
          onChange={handleFileUpload}
          className="text-sm text-gray-300"
        />
        {pseudoContent && (
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="ml-4 bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm"
          >
            {pseudoContent.abstraction_levels.map((level: string) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Loading...
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
} 