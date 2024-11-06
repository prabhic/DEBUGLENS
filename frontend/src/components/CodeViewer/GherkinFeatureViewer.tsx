'use client'

import React, { useState, FC, useEffect, useCallback } from 'react'
import { FeatureContent, ScenarioSection, DebuggerState, VariableState, ScenarioStep } from '@/types/gherkin'
import { setBreakpoint } from '@/services/debugService'
import { parseGherkinFile } from '@/services/gherkinService'
import { ResizablePanel } from '@/components/CodeViewer/ResizablePanel'
import { CodeLine } from './CodeLine'
import { ScenarioList } from './ScenarioList'
import { DebugToolbar } from './DebugToolbar'

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

interface VariablesPanelProps {
  variables: VariableState[];
}

const VariablesPanel: FC<VariablesPanelProps> = ({ variables }) => {
  if (variables.length === 0) return null;

  return (
    <div className="bg-gray-800 text-gray-100 rounded-lg border border-gray-700 overflow-hidden h-full">
      <div className="bg-gray-700 px-4 py-2 border-b border-gray-600">
        <h3 className="text-sm font-semibold text-white">Variables Watch</h3>
      </div>

      <div className="w-full">
        <table className="w-full text-sm">
          <thead className="bg-gray-700/50 border-b border-gray-600">
            <tr>
              <th className="text-left py-2 px-4 font-medium text-gray-300">Name</th>
              <th className="text-left py-2 px-4 font-medium text-gray-300">Previous</th>
              <th className="text-left py-2 px-4 font-medium text-gray-300">Current</th>
              <th className="text-left py-2 px-4 font-medium text-gray-300">Type</th>
            </tr>
          </thead>
          <tbody>
            {variables.map((variable, index) => (
              <tr 
                key={index}
                className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors
                  ${variable.changed ? 'bg-yellow-500/10' : ''}`}
              >
                <td className="py-2 px-4">
                  <span className="font-mono text-blue-300">{variable.name}</span>
                </td>
                <td className="py-2 px-4">
                  <span className="font-mono text-gray-400">{variable.previous || '-'}</span>
                </td>
                <td className="py-2 px-4">
                  <span className="font-mono text-green-300 break-all">{variable.current || variable.value}</span>
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

interface GherkinFeatureViewerProps {
  initialContent: string;
  onReset: () => void;
}

// Add new interfaces at the top
interface ScenarioInfo {
  title: string;
  description?: string;
  lineStart: number;
  lineEnd: number;
}

export const GherkinFeatureViewer: FC<GherkinFeatureViewerProps> = ({ initialContent, onReset }) => {
  const [featureContent, setFeatureContent] = useState<FeatureContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debuggerState, setDebuggerState] = useState<DebuggerState>({
    isDebugging: false,
    currentLine: null,
    breakpoints: new Set(),
    isPaused: false,
    variables: [],
    currentScenario: undefined,
    currentStep: undefined
  });
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(300);
  const [bottomPanelHeight, setBottomPanelHeight] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight * 0.3 : 200
  );
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioInfo>();

  // Add new function to extract scenarios
  const extractScenarios = useCallback((content: string): ScenarioInfo[] => {
    const lines = content.split('\n');
    const scenarios: ScenarioInfo[] = [];
    let currentScenario: Partial<ScenarioInfo> = {};
    let isInScenario = false;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('Scenario:')) {
        isInScenario = true;
        // Save previous scenario if exists
        if (currentScenario.title) {
          scenarios.push({
            ...currentScenario,
            lineEnd: index - 1
          } as ScenarioInfo);
        }
        
        // Start new scenario
        currentScenario = {
          title: trimmedLine.replace('Scenario:', '').trim(),
          lineStart: index
        };
      } else if (isInScenario && currentScenario.title && trimmedLine.startsWith('Description:')) {
        currentScenario.description = trimmedLine.replace('Description:', '').trim();
      }
    });
    
    // Add the last scenario
    if (currentScenario.title) {
      scenarios.push({
        ...currentScenario,
        lineEnd: lines.length - 1
      } as ScenarioInfo);
    }
    
    return scenarios;
  }, []);

  useEffect(() => {
    if (initialContent) {
      setIsLoading(true);
      parseGherkinFile(initialContent)
        .then(parsedContent => {
          setFeatureContent(parsedContent);
          const extractedScenarios = extractScenarios(initialContent);
          setScenarios(extractedScenarios);
          if (extractedScenarios.length > 0) {
            setSelectedScenario(extractedScenarios[0]);
          }
        })
        .catch(err => {
          const errorMessage = err instanceof Error ? err.message : 'Failed to parse feature file';
          setError(errorMessage);
          console.error('Error in file processing:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [initialContent]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['F5', 'F10'].includes(event.key)) {
        event.preventDefault();
      }

      if (!featureContent) return;

      switch (event.key) {
        case 'F5':
          if (event.shiftKey) {
            if (debuggerState.isDebugging) {
              stopDebugging();
            }
          } else {
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
  }, [debuggerState, featureContent]);

  const toggleBreakpoint = async (lineNumber: number) => {
    setDebuggerState(prev => {
      const newBreakpoints = new Set(prev.breakpoints);
      if (newBreakpoints.has(lineNumber)) {
        newBreakpoints.delete(lineNumber);
      } else {
        newBreakpoints.add(lineNumber);
      }
      return { ...prev, breakpoints: newBreakpoints };
    });

    if (process.env.NEXT_PUBLIC_API_ENABLED === 'true') {
      try {
        await setBreakpoint('feature-file', lineNumber, 'default');
      } catch (error) {
        console.error('Error in toggleBreakpoint:', error);
      }
    }
  };

  const startDebugging = () => {
    const sortedBreakpoints = Array.from(debuggerState.breakpoints).sort((a, b) => a - b);
    if (sortedBreakpoints.length === 0) {
      setError('Please set at least one breakpoint before starting debugging');
      return;
    }
    
    setDebuggerState(prev => ({
      ...prev,
      isDebugging: true,
      isPaused: true,
      currentLine: sortedBreakpoints[0],
      currentScenario: 0,
      currentStep: 0
    }));
  };

  const stopDebugging = () => {
    setDebuggerState(prev => ({
      ...prev,
      isDebugging: false,
      isPaused: false,
      currentLine: null,
      variables: [],
      currentScenario: undefined,
      currentStep: undefined
    }));
  };

  const stepNextLine = () => {
    if (!featureContent) return;

    setDebuggerState(prev => {
      if (prev.currentLine === null || !prev.currentScenario === undefined) return prev;

      // Get all lines from all scenarios
      const allLines: { content: string; lineNumber: number }[] = [];
      featureContent.scenarios.forEach((scenario, scenarioIndex) => {
        scenario.steps.forEach((step, stepIndex) => {
          allLines.push({
            content: step,
            lineNumber: calculateLineNumber(scenarioIndex, stepIndex)
          });
        });
      });

      // Find current position
      const currentIndex = allLines.findIndex(line => line.lineNumber === prev.currentLine);
      if (currentIndex === -1 || currentIndex === allLines.length - 1) {
        // End of file reached
        return {
          ...prev,
          isDebugging: false,
          isPaused: false,
          currentLine: null,
          variables: [],
          currentScenario: undefined,
          currentStep: undefined
        };
      }

      // Calculate next line
      const nextLine = allLines[currentIndex + 1];
      const nextScenario = Math.floor(nextLine.lineNumber / 100);
      const nextStep = nextLine.lineNumber % 100 - 1;

      // Update variables based on the current step (example logic)
      let updatedVariables = [...prev.variables];
      
      // Check if we're entering a code block (indicated by """)
      if (nextLine.content.includes('"""')) {
        updatedVariables = updateVariablesForCodeBlock(
          updatedVariables,
          featureContent.scenarios[nextScenario],
          nextStep
        );
      }

      // If we've hit a breakpoint
      if (prev.breakpoints.has(nextLine.lineNumber)) {
        return {
          ...prev,
          currentLine: nextLine.lineNumber,
          currentScenario: nextScenario,
          currentStep: nextStep,
          isPaused: true,
          variables: updatedVariables
        };
      }

      // Regular step to next line
      return {
        ...prev,
        currentLine: nextLine.lineNumber,
        currentScenario: nextScenario,
        currentStep: nextStep,
        variables: updatedVariables
      };
    });
  };

  const continueToNextBreakpoint = () => {
    if (!featureContent) return;

    setDebuggerState(prev => {
      if (prev.currentLine === null) return prev;

      // Get all lines and their numbers
      const allLines: { content: string; lineNumber: number }[] = [];
      featureContent.scenarios.forEach((scenario, scenarioIndex) => {
        scenario.steps.forEach((step, stepIndex) => {
          allLines.push({
            content: step,
            lineNumber: calculateLineNumber(scenarioIndex, stepIndex)
          });
        });
      });

      // Find next breakpoint
      const currentIndex = allLines.findIndex(line => line.lineNumber === prev.currentLine);
      const nextBreakpointLine = allLines.find((line, index) => 
        index > currentIndex && prev.breakpoints.has(line.lineNumber)
      );

      if (!nextBreakpointLine) {
        // No more breakpoints, run to end
        return {
          ...prev,
          isDebugging: false,
          isPaused: false,
          currentLine: null,
          variables: [],
          currentScenario: undefined,
          currentStep: undefined
        };
      }

      const nextScenario = Math.floor(nextBreakpointLine.lineNumber / 100);
      const nextStep = nextBreakpointLine.lineNumber % 100 - 1;

      // Update variables for the next breakpoint
      const updatedVariables = updateVariablesForBreakpoint(
        prev.variables,
        featureContent.scenarios[nextScenario],
        nextStep
      );

      return {
        ...prev,
        currentLine: nextBreakpointLine.lineNumber,
        currentScenario: nextScenario,
        currentStep: nextStep,
        isPaused: true,
        variables: updatedVariables
      };
    });
  };

  const renderContent = () => {
    if (!featureContent) return null;

    const allLines = selectedScenario ? getScenarioLines(initialContent, selectedScenario) : [];

    return (
      <div className="flex flex-col h-full">
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

        {/* Main content area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Scenario panel */}
          <div className="flex-none w-[250px] bg-gray-900 border-r border-gray-700 overflow-y-auto">
            <ScenarioList
              scenarios={scenarios}
              selectedScenario={selectedScenario}
              onSelectScenario={setSelectedScenario}
            />
          </div>

          {/* Code panel */}
          <div className="flex-1 min-w-0">
            <div className="h-full bg-gray-900 text-gray-100">
              <div className="overflow-auto h-full">
                <div className="inline-block min-w-full">
                  {allLines.map((line, index) => (
                    <CodeLine
                      key={index}
                      number={line.lineNumber}
                      content={line.content}
                      hasBreakpoint={debuggerState.breakpoints.has(line.lineNumber)}
                      isCurrentLine={debuggerState.currentLine === line.lineNumber}
                      onToggleBreakpoint={toggleBreakpoint}
                      indentLevel={getIndentLevel(line.content)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Variables panel */}
          {debuggerState.isPaused && (
            <ResizablePanel
              direction="horizontal"
              onResize={(delta) => {
                setRightPanelWidth(prev => Math.max(250, Math.min(800, prev - delta)));
              }}
            >
              <div 
                style={{ width: `${rightPanelWidth}px` }}
                className="h-full bg-gray-900 border-l border-gray-700"
              >
                <VariablesPanel variables={debuggerState.variables} />
              </div>
            </ResizablePanel>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <div className="flex-1 overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full text-red-400">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Loading...
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

// Helper functions
const calculateLineNumber = (scenarioIndex: number, stepIndex: number): number => {
  // Add logic to calculate actual line numbers based on scenario and step index
  return (scenarioIndex * 100) + stepIndex + 1;
};

const getIndentLevel = (step: string): number => {
  const match = step.match(/^\s*/);
  return match ? Math.floor(match[0].length / 2) : 0;
};

// Helper function to update variables when entering a code block
const updateVariablesForCodeBlock = (
  currentVariables: VariableState[],
  scenario: ScenarioSection,
  stepIndex: number
): VariableState[] => {
  // Example logic - you can customize based on your needs
  const step = scenario.steps[stepIndex];
  
  if (step.includes('# @Region:')) {
    const regionName = step.match(/# @Region: (.*)/)?.[1];
    return [
      ...currentVariables,
      {
        name: 'current_region',
        value: regionName,
        type: 'string',
        previous: currentVariables.find(v => v.name === 'current_region')?.value,
        current: regionName,
        changed: true
      }
    ];
  }

  if (step.includes('# @Break:')) {
    const breakpointName = step.match(/# @Break: (.*)/)?.[1];
    return [
      ...currentVariables,
      {
        name: 'break_point',
        value: breakpointName,
        type: 'string',
        previous: currentVariables.find(v => v.name === 'break_point')?.value,
        current: breakpointName,
        changed: true
      }
    ];
  }

  return currentVariables;
};

// Helper function to update variables at breakpoints
const updateVariablesForBreakpoint = (
  currentVariables: VariableState[],
  scenario: ScenarioSection,
  stepIndex: number
): VariableState[] => {
  // Example logic - customize based on your feature file structure
  const step = scenario.steps[stepIndex];
  
  // Check for variable declarations in the step
  const variableMatch = step.match(/(\w+)\s*=\s*{([^}]*)}/);
  if (variableMatch) {
    const [_, varName, varValue] = variableMatch;
    return [
      ...currentVariables,
      {
        name: varName,
        value: varValue.trim(),
        type: 'object',
        previous: currentVariables.find(v => v.name === varName)?.value,
        current: varValue.trim(),
        changed: true
      }
    ];
  }

  return currentVariables;
};

// Helper function to get lines for a specific scenario
const getScenarioLines = (content: string, scenario: ScenarioInfo) => {
  const lines = content.split('\n');
  let scenarioLines: { content: string; lineNumber: number }[] = [];
  let isInScenario = false;
  let isInExecutableBlock = false;
  
  for (let i = scenario.lineStart; i <= scenario.lineEnd; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip scenario title
    if (trimmedLine.startsWith('Scenario:')) {
      isInScenario = true;
      continue;
    }
    
    // Only include Given/When/Then/And steps and code blocks
    if (isInScenario) {
      if (trimmedLine.match(/^(Given|When|Then|And)\s/)) {
        isInExecutableBlock = true;
        scenarioLines.push({
          content: line,
          lineNumber: i + 1
        });
      } else if (trimmedLine.includes('"""')) {
        isInExecutableBlock = !isInExecutableBlock;
        if (isInExecutableBlock) {
          scenarioLines.push({
            content: line,
            lineNumber: i + 1
          });
        }
      } else if (isInExecutableBlock && !trimmedLine.startsWith('Concepts:') && !trimmedLine.startsWith('Variables:')) {
        scenarioLines.push({
          content: line,
          lineNumber: i + 1
        });
      }
    }
  }
  
  return scenarioLines;
};

// Add this function inside the GherkinFeatureViewer component
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
        await setBreakpoint('feature-file', lineNumber, 'default');
      }
      
      console.log('All breakpoints cleared');
    } catch (error) {
      console.error('Error clearing breakpoints:', error);
    }
  }
};

const getExecutableLines = (scenario: ScenarioSection): ScenarioStep[] => {
  return scenario.steps.filter(step => 
    step.type === 'step' || step.type === 'code_block'
  );
};

const getConceptsForLine = (scenario: ScenarioSection, lineNumber: number): string => {
  return scenario.concepts[lineNumber] || '';
};

const getVariablesForLine = (scenario: ScenarioSection, lineNumber: number): VariableState[] => {
  return scenario.variables[lineNumber] || [];
};