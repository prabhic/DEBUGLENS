import React, { FC, useEffect, useMemo, useRef } from 'react';
import { DebugLoadingAnimation } from '@/components/LoadingAnimation';
import { ConceptsPanel } from './ConceptsPanel';
import { VariablesPanel } from './VariablesPanel';
import { ResizablePanel } from '@/components/CodeViewer/ResizablePanel';
import { DebugToolbar } from './DebugToolbar';
import { isFeatureEnabled } from '@/config/features';
import { BackgroundLoadingService } from '@/services/backgroundLoadingService';
import { DebugLensIcon } from '@/components/Icons/DebugLensIcon';
import { FeatureContent, VariableState } from '@/types/gherkin';
import { useAsyncDebug } from '@/contexts/AsyncDebugContext';
import { fetchStepData } from '@/services/asyncDebugService';

interface CodeBlock {
  name: string;
  code: string[];
  variables?: VariableState[];
  conceptDetails?: {
    title: string;
    points: string[];
    focus: string;
  };
}

interface CodeBlockInfo {
  stepIndex: number;
  sectionIndex: number;
  codeBlockIndex: number;
  codeBlock: CodeBlock;
}

interface GherkinJSONAsyncViewerProps {
  content: FeatureContent;
  onReset: () => void;
  onOpenAIChat: () => void;
  isAsyncMode?: boolean;
}

interface ScenarioStep {
  name: string;
  entryPoint?: string;
  sections: {
    name: string;
    codeBlocks: CodeBlock[];
  }[];
}

interface ScenarioSection {
  name: string;
  description?: string;
  tag?: string;
  codeBlocks: CodeBlock[];
}

interface StepState {
  status: 'loading' | 'loaded' | 'error' | 'idle';
  sections?: Array<{
    name: string;
    codeBlocks: Array<{
      name: string;
      code: string[];
      variables: VariableState[];
      conceptDetails: {
        title: string;
        points: string[];
        focus: string;
      };
    }>;
  }>;
  error?: string;
}

interface AsyncDebugState {
  steps: Record<string, StepState>;
}

interface ConceptsPanelProps {
  concepts: {
    title: string;
    points: string[];
    focus: string;
  } | null;
}

export const GherkinJSONAsyncViewer: React.FC<GherkinJSONAsyncViewerProps> = ({
  content,
  onReset,
  onOpenAIChat,
  isAsyncMode: asyncModeFromProps
}) => {
  const { state, dispatch, eventEmitter, isAsyncMode } = useAsyncDebug();
  const [selectedScenario, setSelectedScenario] = React.useState<string>();
  const [rightPanelWidth, setRightPanelWidth] = React.useState<number>(300);
  const [isDebugging, setIsDebugging] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [breakpoints, setBreakpoints] = React.useState<Set<string>>(new Set());
  const [currentCodeBlockIndex, setCurrentCodeBlockIndex] = React.useState<number>(0);
  const [activeCodeBlock, setActiveCodeBlock] = React.useState<CodeBlockInfo | null>(null);
  const [allCodeBlocks, setAllCodeBlocks] = React.useState<CodeBlockInfo[]>([]);
  const [variables, setVariables] = React.useState<VariableState[]>([]);
  const [currentConcepts, setCurrentConcepts] = React.useState<ConceptsPanelProps['concepts'] | null>(null);
  const backgroundLoader = useMemo(() => new BackgroundLoadingService(eventEmitter), [eventEmitter]);
  const isFirstMount = useRef(true);

  // Add memoized current scenario
  const currentScenario = useMemo(() => {
    if (!selectedScenario || !content?.scenarios?.length) {
      return null;
    }
    return content.scenarios.find(s => s.name === selectedScenario) || null;
  }, [selectedScenario, content]);

  // Combine the initialization logic into a single useEffect
  useEffect(() => {
    // Only run initialization once
    if (!isFirstMount.current || !content?.scenarios?.length) {
      return;
    }

    const firstScenario = content.scenarios[0];
    console.log('[AsyncViewer] Setting initial scenario:', {
      name: firstScenario.name,
      stepsCount: firstScenario.steps?.length,
      isFirstMount: isFirstMount.current
    });
    
    setSelectedScenario(firstScenario.name);
    isFirstMount.current = false;
  }, [content, content?.scenarios]); // Add content.scenarios as dependency

  // Update block initialization effect
  useEffect(() => {
    if (!currentScenario) {
      console.log('[AsyncViewer] No scenario available');
      return;
    }

    const processedSteps = currentScenario.steps.map((step) => ({
      ...step,
      sections: step.sections || []
    }));

    console.log('[AsyncViewer] Processing scenario:', {
      name: currentScenario.name,
      stepsCount: processedSteps.length,
      steps: processedSteps.map(step => ({
        name: step.name,
        hasSections: step.sections.length > 0
      }))
    });

    const blocks: CodeBlockInfo[] = [];
    
    processedSteps.forEach((step, stepIndex) => {
      // Create initial placeholder block for each step
      blocks.push({
        stepIndex,
        sectionIndex: 0,
        codeBlockIndex: 0,
        codeBlock: {
          name: `${step.name}_main`,
          code: ['// Loading implementation...'],
          variables: [],
          conceptDetails: {
            title: 'Loading...',
            points: ['Please wait while section details are loaded'],
            focus: 'Section loading'
          }
        }
      });
    });

    console.log('[AsyncViewer] Created blocks:', {
      blockCount: blocks.length,
      blocks: blocks.map(b => ({
        name: b.codeBlock.name,
        isPlaceholder: b.codeBlock.code[0].includes('Loading')
      }))
    });

    setAllCodeBlocks(blocks);
  }, [currentScenario]);

  // Add event handler for section data loading
  useEffect(() => {
    const handleStepLoadSuccess = ({ stepId, data }: { stepId: string; data: any }) => {
      console.log('[AsyncViewer] Step/Section load success - Initial:', { 
        stepId, 
        hasSections: data.sections?.length > 0,
        hasCodeBlocks: data.sections?.[0]?.codeBlocks?.length > 0,
        rawData: data
      });

      // Update state with new section data
      dispatch({ type: 'LOAD_SUCCESS', stepId, data });

      // Update allCodeBlocks with new sections
      setAllCodeBlocks(current => {
        // Extract step index from stepId (ignore section index if present)
        const stepIndex = parseInt(stepId.split('-')[0]);
        
        console.log('[AsyncViewer] Updating code blocks for step:', {
          stepId,
          stepIndex,
          currentBlocksCount: current.length
        });

        // Keep all blocks not related to this step
        const blocksFromOtherSteps = current.filter(b => b.stepIndex !== stepIndex);

        // Create new blocks array with blocks from other steps
        const newBlocks = [...blocksFromOtherSteps];

        // Process new sections and their code blocks
        if (data.sections?.length > 0) {
          data.sections.forEach((section: any, sectionIndex: number) => {
            console.log('[AsyncViewer] Processing section:', {
              sectionIndex,
              sectionName: section.name,
              hasCodeBlocks: !!section.codeBlocks,
              codeBlocksCount: section.codeBlocks?.length
            });

            if (section.codeBlocks) {
              section.codeBlocks.forEach((codeBlock: any, blockIndex: number) => {
                console.log('[AsyncViewer] Adding code block:', {
                  blockIndex,
                  blockName: codeBlock.name,
                  hasVariables: !!codeBlock.variables,
                  hasConcepts: !!codeBlock.conceptDetails
                });

                // Add new block with correct indices
                newBlocks.push({
                  stepIndex,
                  sectionIndex,
                  codeBlockIndex: blockIndex,
                  codeBlock: {
                    ...codeBlock,
                    variables: codeBlock.variables || [],
                    conceptDetails: codeBlock.conceptDetails || {
                      title: 'Loading...',
                      points: [],
                      focus: ''
                    }
                  }
                });
              });
            }
          });
        }

        // Sort blocks by indices to maintain order
        newBlocks.sort((a, b) => {
          if (a.stepIndex !== b.stepIndex) return a.stepIndex - b.stepIndex;
          if (a.sectionIndex !== b.sectionIndex) return a.sectionIndex - b.sectionIndex;
          return a.codeBlockIndex - b.codeBlockIndex;
        });

        console.log('[AsyncViewer] Code blocks update complete:', {
          stepId,
          originalCount: current.length,
          newCount: newBlocks.length,
          blocks: newBlocks.map(b => ({
            name: b.codeBlock.name,
            stepIndex: b.stepIndex,
            sectionIndex: b.sectionIndex,
            blockIndex: b.codeBlockIndex
          }))
        });

        return newBlocks;
      });
    };

    const handleStepLoadFailure = ({ stepId, error }: { stepId: string; error: any }) => {
      console.error('[AsyncViewer] Step/Section load failure:', { stepId, error });
      dispatch({ type: 'LOAD_FAILURE', stepId, error });
    };

    eventEmitter.on('stepLoadSuccess', handleStepLoadSuccess);
    eventEmitter.on('stepLoadFailure', handleStepLoadFailure);

    return () => {
      eventEmitter.off('stepLoadSuccess', handleStepLoadSuccess);
      eventEmitter.off('stepLoadFailure', handleStepLoadFailure);
    };
  }, [dispatch, eventEmitter]);

  const handleCodeBlockClick = async (
    codeBlock: CodeBlock,
    stepIndex: number,
    sectionIndex: number,
    codeBlockIndex: number
  ) => {
    const stepId = `${stepIndex}-${sectionIndex}-${codeBlockIndex}`;
    console.log('[AsyncViewer] Code block clicked:', {
      stepId,
      blockName: codeBlock.name,
      stateStatus: state.steps[stepId]?.status,
      currentState: {
        hasVariables: !!codeBlock.variables?.length,
        hasConcepts: !!codeBlock.conceptDetails,
        codeLines: codeBlock.code.length
      }
    });

    if (state.steps[stepId]?.status === 'loaded') {
      console.log('[AsyncViewer] Using cached step data:', {
        stepId,
        sectionIndex,
        codeBlockIndex,
        hasSection: !!state.steps[stepId].sections?.[sectionIndex],
        hasCodeBlock: !!state.steps[stepId].sections?.[sectionIndex]?.codeBlocks[codeBlockIndex]
      });

      // Get the section data from state
      const section = state.steps[stepId].sections?.[sectionIndex];
      if (section?.codeBlocks[codeBlockIndex]) {
        const block = section.codeBlocks[codeBlockIndex];
        console.log('[AsyncViewer] Updating block data:', {
          stepId,
          blockName: block.name,
          hasVariables: !!block.variables?.length,
          hasConcepts: !!block.conceptDetails
        });

        setVariables(block.variables || []);
        setCurrentConcepts(block.conceptDetails || null);
      }

      setActiveCodeBlock({
        stepIndex,
        sectionIndex,
        codeBlockIndex,
        codeBlock
      });
      return;
    }

    console.log('[AsyncViewer] Loading new step data:', {
      stepId,
      blockName: codeBlock.name,
      currentStatus: state.steps[stepId]?.status || 'none'
    });

    dispatch({ type: 'START_LOADING', stepId });

    try {
      console.log('[AsyncViewer] Fetching step data:', {
        stepId,
        blockName: codeBlock.name,
        hasContent: !!content
      });

      const data = await fetchStepData(codeBlock.name, content);
      
      console.log('[AsyncViewer] Step data received:', {
        stepId,
        hasSections: !!data.sections?.length,
        sectionsCount: data.sections?.length,
        firstSection: {
          name: data.sections?.[0]?.name,
          blockCount: data.sections?.[0]?.codeBlocks?.length
        }
      });

      dispatch({ type: 'LOAD_SUCCESS', stepId, data });
      
      // Update variables and concepts from the first code block
      const firstBlock = data.sections?.[0]?.codeBlocks?.[0];
      if (firstBlock) {
        console.log('[AsyncViewer] Updating from first block:', {
          blockName: firstBlock.name,
          hasVariables: !!firstBlock.variables?.length,
          hasConcepts: !!firstBlock.conceptDetails
        });

        setVariables(firstBlock.variables || []);
        setCurrentConcepts(firstBlock.conceptDetails || null);
      }

      setActiveCodeBlock({
        stepIndex,
        sectionIndex,
        codeBlockIndex,
        codeBlock
      });
    } catch (error: any) {
      console.error('[AsyncViewer] Failed to load step data:', {
        stepId,
        blockName: codeBlock.name,
        error: error.message,
        stack: error.stack
      });
      dispatch({ type: 'LOAD_FAILURE', stepId, error: error.message });
    }
  };

  const renderScenarioContent = () => {
    const scenario = currentScenario;
    if (!scenario) {
      console.log('[AsyncViewer] No scenario to render');
      return null;
    }

    console.log('[AsyncViewer] Rendering scenario:', {
      name: scenario.name,
      stepsCount: scenario.steps.length,
      steps: scenario.steps.map(step => ({
        name: step.name,
        sectionsCount: step.sections?.length || 0
      }))
    });

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

        {/* Steps - Updated to use state data */}
        {scenario.steps.map((step, stepIndex) => {
          // Get step data from state
          const stepId = `${stepIndex}-0-0`;
          const stepState = state.steps[stepId];
          const sections = stepState?.sections || [];

          console.log('[AsyncViewer] Rendering step:', {
            stepIndex,
            name: step.name,
            sectionsCount: sections.length,
            hasStateData: !!stepState
          });
          
          return (
            <div key={step.name} className="space-y-2">
              <h3 className="text-lg font-medium text-white">{step.name}</h3>
              {sections.map((section, sectionIndex) => {
                console.log('[AsyncViewer] Rendering section:', {
                  stepIndex,
                  sectionIndex,
                  name: section.name,
                  blockCount: section.codeBlocks.length
                });
                
                return (
                  <div key={section.name} className="ml-4">
                    <h4 className="text-md font-semibold text-gray-300">{section.name}</h4>
                    {section.codeBlocks.map((block, codeBlockIndex) => {
                      const blockStepId = `${stepIndex}-${sectionIndex}-${codeBlockIndex}`;
                      const blockState = state.steps[blockStepId];
                      return (
                        <div
                          key={block.name}
                          data-active-block={activeCodeBlock?.codeBlock.name === block.name}
                          className="ml-4 cursor-pointer"
                          onClick={() => handleCodeBlockClick(block, stepIndex, sectionIndex, codeBlockIndex)}
                        >
                          <pre className={`p-2 rounded ${blockState?.status === 'loading' ? 'bg-gray-700' : 'bg-gray-800'}`}>
                            {blockState?.status === 'loading' ? (
                              <DebugLoadingAnimation />
                            ) : (
                              block.code.map((line, idx) => <div key={idx}>{line}</div>)
                            )}
                          </pre>
                          {blockState?.status === 'error' && (
                            <div className="text-red-500 text-sm">Failed to load code block.</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Implement other handler functions like handleContinue, handleStepOver, handleStopDebugging, etc.
  const handleStartDebugging = () => {
    // Initialize debugging session
    setIsDebugging(true);
    setIsPaused(false);
    // Load the first code block asynchronously
    if (allCodeBlocks.length > 0) {
      handleCodeBlockClick(
        allCodeBlocks[0].codeBlock,
        allCodeBlocks[0].stepIndex,
        allCodeBlocks[0].sectionIndex,
        allCodeBlocks[0].codeBlockIndex
      );
      setActiveCodeBlock(allCodeBlocks[0]);
      setCurrentCodeBlockIndex(0);
    }
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
    dispatch({ type: 'RESET' }); // Optionally reset the async debug state
  };

  const handleClearBreakpoints = () => {
    setBreakpoints(new Set());
  };
  
  const MIN_PANEL_WIDTH = 200;
  const MAX_PANEL_WIDTH = 600;

  useEffect(() => {
    if (!selectedScenario || !isAsyncMode || !content) {
      return;
    }

    const scenario = content.scenarios.find(s => s.name === selectedScenario);
    if (!scenario) {
      console.error('[AsyncViewer] No scenario found for parallel loading');
      return;
    }

    console.log('[AsyncViewer] Starting parallel loading effect:', {
      scenarioId: selectedScenario,
      stepsCount: scenario.steps.length,
      isAsyncMode,
      hasContent: !!content,
      contentName: content.name
    });

    // Queue loading for each step
    scenario.steps.forEach((step, index) => {
      const stepId = `${index}-0-0`;
      
      if (!state.steps[stepId]) {
        console.log('[AsyncViewer] Queueing step for loading:', {
          stepId,
          stepName: step.name,
          priority: index === 0 ? 2 : 1,
          hasFeatureContent: !!content
        });
        
        dispatch({ type: 'START_LOADING', stepId });
        backgroundLoader.queueStepLoading(
          stepId,
          step.name,
          index === 0 ? 2 : 1,
          content
        );
      }
    });

  }, [selectedScenario, isAsyncMode, content, state.steps]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-none bg-gray-900 border-b border-gray-700">
        <div className="flex items-center h-12">
          {/* Brand section - match sidebar width */}
          <div className="w-64 flex items-center px-4">
            <button 
              onClick={onReset}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <DebugLensIcon className="w-5 h-5" />
              <span className="text-white font-medium ml-3">DebugLens</span>
            </button>
          </div>
          
          {/* Rest of the toolbar content */}
          <DebugToolbar
            isDebugging={isDebugging}
            isPaused={isPaused}
            hasBreakpoints={breakpoints.size > 0}
            onStartDebugging={() => {/* Implement start debugging */}}
            onStopDebugging={handleStopDebugging}
            onContinue={handleContinue}
            onStepOver={handleStepOver}
            onClearBreakpoints={handleClearBreakpoints}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-64 flex-none border-r border-gray-700 overflow-y-auto bg-gray-900">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Scenarios</h3>
            <div className="space-y-1">
              {content.scenarios.map((scenario) => (
                <button
                  key={scenario.name}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-700/50 transition-colors rounded ${
                    selectedScenario === scenario.name ? 'bg-gray-700/70 text-blue-400' : 'text-gray-300'
                  }`}
                  onClick={() => setSelectedScenario(scenario.name)}
                >
                  <div className="text-sm">{scenario.name}</div>
                  {scenario.description && (
                    <div className="text-xs text-gray-500 mt-1">{scenario.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center and right panels */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Code panel */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-4">
                {renderScenarioContent()}
              </div>
            </div>

            {/* Concepts panel */}
            {currentConcepts && (
              <div className="flex-none border-t border-gray-700">
                <ConceptsPanel concepts={currentConcepts} />
              </div>
            )}
          </div>

          {/* Variables panel */}
          {variables.length > 0 && (
            <ResizablePanel
              direction="horizontal"
              onResize={(delta) => {
                setRightPanelWidth((prev) =>
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