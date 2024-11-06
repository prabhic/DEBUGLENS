'use client'

import React, { useState, FC } from 'react'
import { GitFeatureContent, Category, VariableState } from '@/types/gherkin'
import { ResizablePanel } from '@/components/CodeViewer/ResizablePanel'
import { CodeLine } from './CodeLine'
import { DebugToolbar } from './DebugToolbar'

interface GherkinJSONViewerProps {
  content: GitFeatureContent;
  onReset: () => void;
}

interface ScenarioData {
  name: string;
  description: string;
  tag: string;
  steps: {
    name: string;
    entryPoint?: string;
    regions: {
      name: string;
      breakpoints: {
        name: string;
        code: string[];
        variables?: VariableState[];
        concepts?: {
          title: string;
          points: string[];
          focus: string;
        };
      }[];
    }[];
  }[];
}

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
    <div className="bg-gray-800 text-gray-100 rounded-lg border border-gray-700 overflow-hidden mt-4">
      <div className="bg-gray-700 px-4 py-2 border-b border-gray-600">
        <h3 className="text-sm font-semibold text-white">Concepts</h3>
      </div>
      <div className="p-4">
        <h4 className="text-lg font-medium text-blue-400 mb-2">{concepts.title}</h4>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
          {concepts.points.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h5 className="text-sm font-medium text-gray-400">Current Focus</h5>
          <p className="text-sm text-green-400 mt-1">{concepts.focus}</p>
        </div>
      </div>
    </div>
  );
};

export const GherkinJSONViewer: FC<GherkinJSONViewerProps> = ({ content, onReset }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedScenario, setSelectedScenario] = useState<string>();
  const [variables, setVariables] = useState<VariableState[]>([]);
  const [currentConcepts, setCurrentConcepts] = useState<ConceptsPanelProps['concepts'] | null>(null);
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(300);

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
        regions: step.regions || []
      }))
    };
  };

  const handleBreakpointClick = (breakpoint: ScenarioData['steps'][0]['regions'][0]['breakpoints'][0]) => {
    if (breakpoint.variables) {
      setVariables(breakpoint.variables);
    }
    if (breakpoint.concepts) {
      setCurrentConcepts(breakpoint.concepts);
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
            
            {/* Regions */}
            {step.regions?.map((region, regionIndex) => (
              <div key={regionIndex} className="pl-4 border-l-2 border-gray-700">
                <div className="text-gray-400 text-sm mb-2">{region.name}</div>
                <div className="space-y-1">
                  {/* Breakpoints */}
                  {region.breakpoints.map((breakpoint, breakpointIndex) => (
                    <div 
                      key={breakpointIndex}
                      className="pl-4"
                    >
                      <button
                        onClick={() => handleBreakpointClick(breakpoint)}
                        className="text-left w-full hover:bg-gray-800 p-2 rounded transition-colors"
                      >
                        <div className="text-yellow-500 text-sm mb-1">{breakpoint.name}</div>
                        <div className="font-mono text-sm text-gray-300 whitespace-pre">
                          {breakpoint.code.join('\n')}
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

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <div className="flex-1 flex min-h-0">
        {/* Left panel - Categories and Scenarios */}
        <div className="w-[250px] border-r border-gray-700 overflow-y-auto custom-scrollbar bg-gray-900">
          {content.categories && (
            <CategoryList
              categories={content.categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          )}
          {selectedCategory && content.categories && (
            <div className="px-4">
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

        {/* Main content area with right panel */}
        <div className="flex-1 flex min-h-0">
          {/* Editor panel */}
          <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-gray-900">
            {renderScenarioContent()}
          </div>

          {/* Variables and Concepts panel */}
          {(variables.length > 0 || currentConcepts) && (
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
                className="h-full bg-gray-900 p-4 space-y-4 custom-scrollbar overflow-auto"
              >
                {variables.length > 0 && <VariablesPanel variables={variables} />}
                {currentConcepts && <ConceptsPanel concepts={currentConcepts} />}
              </div>
            </ResizablePanel>
          )}
        </div>
      </div>
    </div>
  );
};