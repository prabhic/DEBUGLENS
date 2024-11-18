import React, { FC, useEffect, useMemo } from 'react';
import { GherkinJSONViewerProps, StepData } from '@/components/CodeViewer/GherkinJSONViewer';
import { useAsyncDebug } from '@/contexts/AsyncDebugContext';
import { fetchStepData } from '@/services/asyncDebugService';
import { DebugLoadingAnimation } from '@/components/LoadingAnimation';
import { ConceptsPanel } from './ConceptsPanel';
import { VariablesPanel } from './VariablesPanel';
import { ResizablePanel } from '@/components/CodeViewer/ResizablePanel';
import { DebugToolbar } from './DebugToolbar';
import { isFeatureEnabled } from '@/config/features';
import { BackgroundLoadingService } from '@/services/BackgroundLoadingService';
import { DebugLensIcon } from '@/components/Icons/DebugLensIcon';

export const GherkinJSONAsyncViewer: FC<GherkinJSONViewerProps> = ({ 
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

  useEffect(() => {
    console.log('[AsyncViewer] Setting up event listeners');

    const handleStepLoadSuccess = ({ stepId, data }: { stepId: string; data: any }) => {
      console.log('[AsyncViewer] Step load success event:', { stepId, dataKeys: Object.keys(data) });
      dispatch({ type: 'LOAD_SUCCESS', stepId, data });
    };

    const handleStepLoadFailure = ({ stepId, error }: { stepId: string; error: any }) => {
      console.error('[AsyncViewer] Step load failure event:', { stepId, error });
      dispatch({ type: 'LOAD_FAILURE', stepId, error });
    };

    eventEmitter.on('stepLoadSuccess', handleStepLoadSuccess);
    eventEmitter.on('stepLoadFailure', handleStepLoadFailure);

    return () => {
      console.log('[AsyncViewer] Cleaning up event listeners');
      eventEmitter.off('stepLoadSuccess', handleStepLoadSuccess);
      eventEmitter.off('stepLoadFailure', handleStepLoadFailure);
    };
  }, [dispatch, eventEmitter]);

  // Select first scenario by default
  useEffect(() => {
    if (content.scenarios && content.scenarios.length > 0) {
      console.log('[AsyncViewer] Setting first scenario:', { scenario: content.scenarios[0].name });
      
      setSelectedScenario(content.scenarios[0].name);
    }
  }, [content]);
  

  const getCurrentScenario = (): ScenarioData | null => {
    if (!selectedScenario) return null;

    const scenario = content.scenarios.find(s => s.name === selectedScenario);
    if (!scenario) return null;

    return {
      name: scenario.name,
      description: scenario.description || '',
      tag: scenario.tag || 'Default',
      steps: scenario.steps
    };
  };

  const handleCodeBlockClick = async (
    codeBlock: CodeBlock,
    stepIndex: number,
    sectionIndex: number,
    codeBlockIndex: number
  ) => {
    const stepId = `${stepIndex}-${sectionIndex}-${codeBlockIndex}`;

    if (state.steps[stepId]?.status === 'loaded') {
      setVariables(state.steps[stepId].variables || []);
      setCurrentConcepts(state.steps[stepId].concepts || null);
      setActiveCodeBlock({
        stepIndex,
        sectionIndex,
        codeBlockIndex,
        codeBlock
      });
      return;
    }

    dispatch({ type: 'START_LOADING', stepId });

    try {
      const data = await fetchStepData(codeBlock.name);
      dispatch({ type: 'LOAD_SUCCESS', stepId, data });
      setVariables(data.variables || []);
      setCurrentConcepts(data.concepts || null);
      setActiveCodeBlock({
        stepIndex,
        sectionIndex,
        codeBlockIndex,
        codeBlock
      });
    } catch (error: any) {
      dispatch({ type: 'LOAD_FAILURE', stepId, error: error.message });
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
          <div key={step.name} className="space-y-2">
            <h3 className="text-lg font-medium text-white">{step.name}</h3>
            {step.sections.map((section, sectionIndex) => (
              <div key={section.name} className="ml-4">
                <h4 className="text-md font-semibold text-gray-300">{section.name}</h4>
                {section.codeBlocks.map((block, codeBlockIndex) => {
                  const stepId = `${stepIndex}-${sectionIndex}-${codeBlockIndex}`;
                  const stepState = state.steps[stepId];
                  return (
                    <div
                      key={block.name}
                      data-active-block={activeCodeBlock?.codeBlock.name === block.name}
                      className="ml-4 cursor-pointer"
                      onClick={() => handleCodeBlockClick(block, stepIndex, sectionIndex, codeBlockIndex)}
                    >
                      <pre className={`p-2 rounded ${stepState?.status === 'loading' ? 'bg-gray-700' : 'bg-gray-800'}`}>
                        {stepState?.status === 'loading' ? (
                          <DebugLoadingAnimation />
                        ) : (
                          block.code.map((line, idx) => <div key={idx}>{line}</div>)
                        )}
                      </pre>
                      {stepState?.status === 'error' && (
                        <div className="text-red-500 text-sm">Failed to load code block.</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
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
  
  useEffect(() => {
    console.log('[AsyncViewer] Starting parallel loading effect:', {
      scenarioId: selectedScenario,
      stateStepsCount: Object.keys(state.steps).length,
      allCodeBlocksCount: allCodeBlocks.length,
      isAsyncMode,
      asyncModeFromProps,
      isParallelLoadingEnabled: isFeatureEnabled('PARALLEL_LOADING'),
      hasContent: !!content
    });

    if (!isFeatureEnabled('PARALLEL_LOADING')) {
      console.log('[AsyncViewer] Parallel loading feature is disabled');
      return;
    }

    // Check for either context or prop async mode
    if (!isAsyncMode && !asyncModeFromProps) {
      console.log('[AsyncViewer] Not in async mode', { 
        contextAsyncMode: isAsyncMode, 
        propsAsyncMode: asyncModeFromProps 
      });
      return;
    }

    if (!content) {
      console.log('[AsyncViewer] No content available');
      return;
    }

    const scenario = getCurrentScenario();
    if (!scenario) {
      console.error('[AsyncViewer] No scenario found for parallel loading');
      return;
    }

    console.log('[AsyncViewer] Current scenario:', {
      name: scenario.name,
      stepsCount: scenario.steps.length,
      currentBlocks: allCodeBlocks.length
    });

    // Initialize allCodeBlocks if not already done
    if (allCodeBlocks.length === 0) {
      console.log('[AsyncViewer] Initializing code blocks');
      const blocks: CodeBlockInfo[] = [];
      scenario.steps.forEach((step, stepIndex) => {
        step.sections.forEach((section, sectionIndex) => {
          section.codeBlocks.forEach((block, codeBlockIndex) => {
            blocks.push({
              stepIndex,
              sectionIndex,
              codeBlockIndex,
              codeBlock: block
            });
          });
        });
      });
      console.log('[AsyncViewer] Created blocks:', {
        blockCount: blocks.length,
        firstBlock: blocks[0]?.codeBlock.name,
        lastBlock: blocks[blocks.length - 1]?.codeBlock.name
      });
      setAllCodeBlocks(blocks);
      return; // Exit and let next effect iteration handle loading
    }

    console.log('[AsyncViewer] Starting block loading loop:', {
      totalBlocks: allCodeBlocks.length,
      loadedBlocks: Object.keys(state.steps).length
    });

    // Queue all blocks for loading
    allCodeBlocks.forEach((block, index) => {
      const stepId = `${block.stepIndex}-${block.sectionIndex}-${block.codeBlockIndex}`;
      const priority = index === 0 ? 2 : 1;
      
      if (state.steps[stepId]?.status === 'loaded' || state.steps[stepId]?.status === 'loading') {
        console.log('[AsyncViewer] Skipping already loaded/loading block:', {
          stepId,
          status: state.steps[stepId]?.status,
          blockName: block.codeBlock.name
        });
        return;
      }

      // Dispatch START_LOADING before queueing
      dispatch({ type: 'START_LOADING', stepId });

      console.log('[AsyncViewer] Queueing block for loading:', {
        stepId,
        blockName: block.codeBlock.name,
        priority,
        blockIndex: index,
        totalBlocks: allCodeBlocks.length
      });

      backgroundLoader.queueStepLoading(stepId, block.codeBlock.name, priority);
    });
  }, [selectedScenario, state.steps, dispatch, eventEmitter, isAsyncMode, asyncModeFromProps, content, allCodeBlocks, backgroundLoader]);
  
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