'use client'

import React, { useState, FC, useEffect } from 'react'
import { GitFeatureContent, Category, VariableState } from '@/types/gherkin'
import { ResizablePanel } from '@/components/CodeViewer/ResizablePanel'
import { CodeLine } from './CodeLine'
import { DebugToolbar } from './DebugToolbar'

interface GherkinJSONViewerProps {
  content: GitFeatureContent;
  onReset: () => void;
}

interface ScenarioStep {
  name: string;
  entryPoint?: string;
  sections: {
    name: string;
    codeBlocks: {
      name: string;
      code: string[];
      variables?: VariableState[];
      conceptDetails?: {
        title: string;
        points: string[];
        focus: string;
      };
    }[];
  }[];
}

interface ScenarioData {
  name: string;
  description: string;
  tag: string;
  steps: ScenarioStep[];
}

interface VariablesPanelProps {
  variables: VariableState[];
}

const VariablesPanel: FC<VariablesPanelProps> = ({ variables }) => {
  if (variables.length === 0) return null;

  // Helper function to format value with syntax highlighting
  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      try {
        // Pretty print objects with 2-space indentation
        return JSON.stringify(value, null, 2);
      } catch (e) {
        return String(value);
      }
    }
    return String(value);
  };

  // Group variables by their type for better organization
  const groupedVariables = variables.reduce((acc, variable) => {
    const group = variable.type || 'other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(variable);
    return acc;
  }, {} as Record<string, VariableState[]>);

  return (
    <div className="bg-gray-800 text-gray-100 rounded-lg border border-gray-700 overflow-hidden h-full">
      <div className="bg-gray-700 px-4 py-2 border-b border-gray-600">
        <h3 className="text-sm font-semibold text-white">Data Structure Watch</h3>
      </div>

      <div className="divide-y divide-gray-700">
        {Object.entries(groupedVariables).map(([type, vars]) => (
          <div key={type} className="p-2">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              {type} Structures
            </div>
            
            {vars.map((variable, index) => (
              <div 
                key={index}
                className={`mb-3 rounded-lg p-3 ${
                  variable.important ? 'bg-yellow-500/10 border border-yellow-500/30' 
                  : 'bg-gray-700/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-blue-300">{variable.name}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                    {variable.type}
                  </span>
                </div>

                {/* Show changes if there's a previous value */}
                {variable.previous !== undefined && (
                  <div className="mb-2">
                    <div className="text-xs text-gray-400 mb-1">Previous:</div>
                    <pre className="font-mono text-sm text-gray-400 bg-gray-800/50 p-2 rounded overflow-auto">
                      {formatValue(variable.previous)}
                    </pre>
                  </div>
                )}

                <div>
                  <div className="text-xs text-gray-400 mb-1">Current:</div>
                  <pre className="font-mono text-sm text-green-300 bg-gray-800/50 p-2 rounded overflow-auto">
                    {formatValue(variable.current)}
                  </pre>
                </div>

                {/* Show change indicator if value changed */}
                {variable.previous !== undefined && variable.previous !== variable.current && (
                  <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0-16l4 4m-4-4l-4 4" />
                    </svg>
                    Value changed
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

interface CategoryListProps {
  categories: Record<string, {
    scenarios: string[];
    complexity: string;
  }>;
  onSelectCategory: (category: string) => void;
  selectedCategory?: string;
}

const CategoryList: FC<CategoryListProps> = ({ categories, onSelectCategory, selectedCategory }) => {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-2 px-4">Categories</h3>
      <div className="space-y-1">
        {Object.entries(categories).map(([name, category]) => (
          <button
            key={name}
            className={`w-full text-left px-4 py-2 hover:bg-gray-700/50 transition-colors
              ${selectedCategory === name ? 'bg-gray-700/70 text-blue-400' : 'text-gray-300'}`}
            onClick={() => onSelectCategory(name)}
          >
            <div className="text-sm">{name}</div>
            <div className="text-xs text-gray-500">
              {category.complexity} · {category.scenarios.length} scenarios
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

interface ConceptsPanelProps {
  concepts: {
    title: string;
    points: string[];
    focus: string;
  };
}

const ConceptsPanel: FC<ConceptsPanelProps> = ({ concepts }) => {
  return (
    <div className="border-t border-gray-700 bg-gray-800">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Concepts</h3>
          <h4 className="text-lg font-medium text-blue-400">{concepts.title}</h4>
        </div>
        <div className="flex gap-8">
          <div className="flex-1">
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
              {concepts.points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
          <div className="flex-1">
            <h5 className="text-sm font-medium text-gray-400 mb-2">Current Focus</h5>
            <p className="text-sm text-green-400">{concepts.focus}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CodeBlockInfo {
  stepIndex: number;
  sectionIndex: number;
  codeBlockIndex: number;
  codeBlock: ScenarioData['steps'][0]['sections'][0]['codeBlocks'][0];
}

export const GherkinJSONViewer: FC<GherkinJSONViewerProps> = ({ content, onReset }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedScenario, setSelectedScenario] = useState<string>();
  const [variables, setVariables] = useState<VariableState[]>([]);
  const [currentConcepts, setCurrentConcepts] = useState<ConceptsPanelProps['concepts'] | null>(null);
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(300);
  const [isDebugging, setIsDebugging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [breakpoints, setBreakpoints] = useState<Set<string>>(new Set());
  const [currentCodeBlockIndex, setCurrentCodeBlockIndex] = useState<number>(0);
  const [activeCodeBlock, setActiveCodeBlock] = useState<CodeBlockInfo | null>(null);
  const [allCodeBlocks, setAllCodeBlocks] = useState<CodeBlockInfo[]>([]);

  // Select first category by default
  React.useEffect(() => {
    if (content.categories) {
      const firstCategory = Object.keys(content.categories)[0];
      setSelectedCategory(firstCategory);
      
      // Select first scenario in the category
      if (firstCategory && content.categories[firstCategory].scenarios.length > 0) {
        setSelectedScenario(content.categories[firstCategory].scenarios[0]);
      }
    }
  }, [content]);

  const getCurrentScenario = (): ScenarioData | null => {
    if (!selectedScenario) return null;
    
    // Find scenario by doing a case-insensitive match with normalization
    const scenario = content.scenarios.find(s => {
      const normalizeString = (str: string) => 
        str.toLowerCase()
           .replace(/\s+/g, ' ')
           .trim()
           .replace(/[-_]/g, ' ')
           .replace(/ing\b/g, ''); // Remove 'ing' at word boundaries
      
      const scenarioName = normalizeString(s.name);
      const selected = normalizeString(selectedScenario);
      
      console.log('Matching:', selected, 'with:', scenarioName); // Debug log
      
      // Get base words (removing common prefixes like 'git')
      const getBaseWords = (str: string) => 
        str.split(' ')
           .filter(word => !['git', 'the', 'a', 'an'].includes(word));
      
      const scenarioWords = getBaseWords(scenarioName);
      const selectedWords = getBaseWords(selected);
      
      // Check if the key word from selected scenario exists in the full scenario name
      return selectedWords.some(word => 
        scenarioWords.some(scenarioWord => 
          scenarioWord === word || 
          scenarioWord.startsWith(word) || 
          word.startsWith(scenarioWord)
        )
      );
    });
    
    console.log('Selected:', selectedScenario);
    console.log('Found:', scenario?.name);
    
    if (!scenario) return null;

    return {
      name: scenario.name,
      description: scenario.description || '',
      tag: scenario.tag || 'Default',
      steps: scenario.steps.map(step => ({
        name: step.name || '',
        entryPoint: step.entryPoint,
        sections: step.sections.map(section => ({
          name: section.name,
          codeBlocks: section.codeBlocks.map(block => ({
            name: block.name,
            code: block.code,
            variables: block.variables,
            conceptDetails: block.conceptDetails
          }))
        }))
      }))
    };
  };

  const handleCodeBlockClick = (
    codeBlock: ScenarioData['steps'][0]['sections'][0]['codeBlocks'][0],
    stepIndex: number,
    sectionIndex: number,
    codeBlockIndex: number
  ) => {
    if (codeBlock.variables) {
      setVariables(codeBlock.variables);
    }
    if (codeBlock.conceptDetails) {
      setCurrentConcepts(codeBlock.conceptDetails);
    }
    
    if (isDebugging) {
      setActiveCodeBlock({
        stepIndex,
        sectionIndex,
        codeBlockIndex,
        codeBlock
      });

      // Add auto-scroll functionality
      setTimeout(() => {
        const activeElement = document.querySelector('[data-active-block="true"]');
        if (activeElement) {
          const container = activeElement.closest('.overflow-y-auto');
          if (container) {
            const elementRect = activeElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            // Check if element is below the visible area
            if (elementRect.bottom > containerRect.bottom) {
              activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            // Check if element is above the visible area
            else if (elementRect.top < containerRect.top) {
              activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      }, 0);
    }
  };

  const renderScenarioContent = () => {
    const scenario = getCurrentScenario();
    if (!scenario) return null;

    return (
      <div className="space-y-4">
        {/* Scenario header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-400">{scenario.name}</h2>
          <p className="text-gray-400 mt-2">{scenario.description}</p>
          <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded bg-gray-700 text-gray-300">
            {scenario.tag}
          </span>
        </div>

        {/* Steps */}
        {scenario.steps.map((step, stepIndex) => (
          <div key={stepIndex} className="space-y-2">
            {step.name && (
              <div className="flex items-center space-x-2">
                <div className="text-blue-400 font-medium">{step.name}</div>
                {step.entryPoint && (
                  <span className="text-sm text-gray-500">({step.entryPoint})</span>
                )}
              </div>
            )}
            
            {/* Sections (previously regions) */}
            {step.sections?.map((section, sectionIndex) => (
              <div key={sectionIndex} className="pl-4 border-l-2 border-gray-700">
                <div className="text-gray-400 text-sm mb-2">{section.name}</div>
                <div className="space-y-1">
                  {/* CodeBlocks (previously breakpoints) */}
                  {section.codeBlocks.map((codeBlock, codeBlockIndex) => (
                    <div 
                      key={codeBlockIndex}
                      className="pl-4"
                    >
                      <button
                        onClick={() => handleCodeBlockClick(codeBlock, stepIndex, sectionIndex, codeBlockIndex)}
                        className={`text-left w-full p-2 rounded transition-colors relative
                          ${breakpoints.has(codeBlock.name) ? 'border-l-2 border-red-500' : ''}
                          ${activeCodeBlock?.codeBlock.name === codeBlock.name 
                            ? 'bg-blue-500/20 border-l-2 border-blue-500' 
                            : 'hover:bg-gray-800'}`}
                        disabled={isDebugging && activeCodeBlock?.codeBlock.name !== codeBlock.name}
                        data-active-block={activeCodeBlock?.codeBlock.name === codeBlock.name}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-yellow-500 text-sm mb-1 flex items-center gap-2">
                            {codeBlock.name}
                            {activeCodeBlock?.codeBlock.name === codeBlock.name && (
                              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            )}
                          </div>
                          {!isDebugging && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBreakpoint(codeBlock.name);
                              }}
                              className={`px-2 py-1 rounded text-xs ${
                                breakpoints.has(codeBlock.name)
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-gray-700 text-gray-400'
                              }`}
                            >
                              {breakpoints.has(codeBlock.name) ? 'Remove Breakpoint' : 'Set Breakpoint'}
                            </button>
                          )}
                        </div>
                        <div className="font-mono text-sm text-gray-300 whitespace-pre">
                          {codeBlock.code.join('\n')}
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Update the scenario selection handler
  const handleScenarioSelect = (scenarioName: string) => {
    console.log('Selecting scenario:', scenarioName);
    setSelectedScenario(scenarioName);
  };

  // Update the minimum and maximum width constraints
  const MIN_PANEL_WIDTH = 250;
  const MAX_PANEL_WIDTH = 800;

  const scrollActiveStepIntoView = () => {
    const activeElement = document.querySelector('[data-active-block="true"]');
    if (!activeElement) return;

    const container = activeElement.closest('.overflow-y-auto');
    if (!container) return;

    const elementRect = activeElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Check if element is not fully visible
    if (elementRect.top < containerRect.top || 
        elementRect.bottom > containerRect.bottom) {
      activeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  const handleStartDebugging = () => {
    const scenario = getCurrentScenario();
    if (!scenario) return;

    // Collect all code blocks
    const codeBlocks: CodeBlockInfo[] = [];
    scenario.steps.forEach((step, stepIndex) => {
      step.sections.forEach((section, sectionIndex) => {
        section.codeBlocks.forEach((block, blockIndex) => {
          codeBlocks.push({
            stepIndex,
            sectionIndex,
            codeBlockIndex: blockIndex,
            codeBlock: block
          });
        });
      });
    });

    // Find first breakpoint or start from beginning
    let startIndex = 0;
    if (breakpoints.size > 0) {
      startIndex = codeBlocks.findIndex(block => breakpoints.has(block.codeBlock.name));
      if (startIndex === -1) startIndex = 0;
    }

    setAllCodeBlocks(codeBlocks);
    setIsDebugging(true);
    setIsPaused(true);
    setCurrentCodeBlockIndex(startIndex);

    // Activate first code block
    const first = codeBlocks[startIndex];
    handleCodeBlockClick(
      first.codeBlock,
      first.stepIndex,
      first.sectionIndex,
      first.codeBlockIndex
    );
    setActiveCodeBlock(first);

    // Ensure scroll happens after state updates
    setTimeout(scrollActiveStepIntoView, 100);
  };

  const handleContinue = () => {
    if (!isDebugging || !activeCodeBlock) return;

    let nextIndex = currentCodeBlockIndex + 1;
    
    // Find next breakpoint
    while (nextIndex < allCodeBlocks.length) {
      if (breakpoints.has(allCodeBlocks[nextIndex].codeBlock.name)) {
        break;
      }
      nextIndex++;
    }

    if (nextIndex >= allCodeBlocks.length) {
      // No more breakpoints, stop debugging
      handleStopDebugging();
      return;
    }

    // Move to next breakpoint
    const next = allCodeBlocks[nextIndex];
    handleCodeBlockClick(
      next.codeBlock,
      next.stepIndex,
      next.sectionIndex,
      next.codeBlockIndex
    );
    setActiveCodeBlock(next);
    setCurrentCodeBlockIndex(nextIndex);
  };

  const handleStepOver = () => {
    if (!isDebugging || !activeCodeBlock) return;

    const nextIndex = currentCodeBlockIndex + 1;

    if (nextIndex >= allCodeBlocks.length) {
      // No more code blocks, stop debugging
      handleStopDebugging();
      return;
    }

    // Move to next code block
    const next = allCodeBlocks[nextIndex];
    handleCodeBlockClick(
      next.codeBlock,
      next.stepIndex,
      next.sectionIndex,
      next.codeBlockIndex
    );
    setActiveCodeBlock(next);
    setCurrentCodeBlockIndex(nextIndex);
    setIsPaused(true);
  };

  const handleStopDebugging = () => {
    setIsDebugging(false);
    setIsPaused(false);
    setCurrentCodeBlockIndex(0);
    setActiveCodeBlock(null);
    setVariables([]);
    setCurrentConcepts(null);
    setAllCodeBlocks([]);
  };

  const handleClearBreakpoints = () => {
    setBreakpoints(new Set());
  };

  const toggleBreakpoint = (breakpointName: string) => {
    setBreakpoints(prev => {
      const newBreakpoints = new Set(prev);
      if (newBreakpoints.has(breakpointName)) {
        newBreakpoints.delete(breakpointName);
      } else {
        newBreakpoints.add(breakpointName);
      }
      return newBreakpoints;
    });
  };

  const getCurrentDebugInfo = () => {
    if (!activeCodeBlock) return null;

    const scenario = getCurrentScenario();
    if (!scenario) return null;

    const step = scenario.steps[activeCodeBlock.stepIndex];
    const section = step.sections[activeCodeBlock.sectionIndex];
    const block = section.codeBlocks[activeCodeBlock.codeBlockIndex];

    return {
      stepName: step.name,
      sectionName: section.name,
      blockName: block.name,
      variables: block.variables || [],
      concepts: block.conceptDetails
    };
  };

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent F5 refresh regardless of debug state
      if (event.key === 'F5') {
        event.preventDefault(); // Move this before the debugging check
      }

      // Only handle debug shortcuts if debugging is active (except for F5 start)
      if (!isDebugging && !['F5', 'F8', 'F10'].includes(event.key)) return;

      switch (event.key) {
        case 'F8':
          event.preventDefault();
          handleContinue();
          break;
        case 'F10':
          event.preventDefault();
          handleStepOver();
          break;
        case 'F5':
          if (event.shiftKey) {
            handleStopDebugging();
          } else {
            if (!isDebugging) {
              handleStartDebugging();
            } else {
              handleStopDebugging();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDebugging, handleContinue, handleStepOver, handleStartDebugging, handleStopDebugging]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Debug toolbar */}
      <div className="flex-none bg-gray-900 border-b border-gray-700">
        <div className="flex items-center h-12">
          {/* Brand section - match sidebar width */}
          <div className="w-64 flex items-center px-4">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4V4C8 4 4 8 4 12V12C4 16 8 20 12 20V20C16 20 20 16 20 12V12C20 8 16 4 12 4Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 12L12 12M12 12L9 12M12 12L12 9M12 12L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-white font-medium ml-3">DebugLens</span>
          </div>

          {/* Toolbar buttons - aligned with main content */}
          <div className="px-4">
            <DebugToolbar
              isDebugging={isDebugging}
              isPaused={isPaused}
              hasBreakpoints={breakpoints.size > 0}
              onStartDebugging={handleStartDebugging}
              onStopDebugging={handleStopDebugging}
              onContinue={handleContinue}
              onStepOver={handleStepOver}
              onClearBreakpoints={handleClearBreakpoints}
            />
          </div>
        </div>
      </div>

      {/* Main content area - fills remaining space with internal scrolling */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left sidebar - fixed width with internal scroll */}
        <div className="w-64 flex-none border-r border-gray-700 overflow-y-auto bg-gray-900">
          <div className="p-4">
            {content.categories && (
              <CategoryList
                categories={content.categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            )}
            {selectedCategory && content.categories && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Scenarios</h3>
                <div className="space-y-1">
                  {content.categories[selectedCategory].scenarios.map((scenario) => (
                    <button
                      key={scenario}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-700/50 transition-colors rounded
                        ${selectedScenario === scenario ? 'bg-gray-700/70 text-blue-400' : 'text-gray-300'}`}
                      onClick={() => handleScenarioSelect(scenario)}
                    >
                      {scenario}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center and right panels - with internal scrolling */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Code panel - with internal scroll */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {renderScenarioContent()}
              </div>
            </div>
            
            {/* Concepts panel - fixed at bottom when visible */}
            {currentConcepts && (
              <div className="flex-none border-t border-gray-700">
                <ConceptsPanel concepts={currentConcepts} />
              </div>
            )}
          </div>

          {/* Variables panel - resizable with internal scroll */}
          {variables.length > 0 && (
            <ResizablePanel
              direction="horizontal"
              onResize={(delta) => {
                setRightPanelWidth(prev => 
                  Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, prev - delta))
                );
              }}
              className="border-l border-gray-700 hover:border-gray-500 transition-colors"
            >
              <div 
                style={{ width: `${rightPanelWidth}px` }}
                className="h-full bg-gray-900 overflow-hidden flex flex-col"
              >
                <VariablesPanel variables={variables} />
              </div>
            </ResizablePanel>
          )}
        </div>
      </div>
    </div>
  );
};