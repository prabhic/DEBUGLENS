import React, { FC } from 'react';
import { ScenarioInfo } from '@/types/gherkin';

interface ScenarioListProps {
  scenarios: ScenarioInfo[];
  selectedScenario?: ScenarioInfo;
  onSelectScenario: (scenario: ScenarioInfo) => void;
}

export const ScenarioList: FC<ScenarioListProps> = ({
  scenarios,
  selectedScenario,
  onSelectScenario
}) => {
  return (
    <div className="flex flex-col gap-1 p-2">
      <h3 className="text-sm font-semibold text-gray-300 px-2 py-1">Scenarios</h3>
      {scenarios.map((scenario, index) => (
        <button
          key={index}
          className={`text-left px-3 py-2 rounded text-sm ${
            selectedScenario === scenario
              ? 'bg-blue-500/20 text-blue-200'
              : 'text-gray-300 hover:bg-gray-800'
          }`}
          onClick={() => onSelectScenario(scenario)}
        >
          <div className="font-medium">{scenario.title}</div>
          {scenario.description && (
            <div className="text-xs text-gray-400 mt-1">{scenario.description}</div>
          )}
        </button>
      ))}
    </div>
  );
}; 