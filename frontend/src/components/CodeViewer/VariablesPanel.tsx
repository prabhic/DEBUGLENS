import React, { FC } from 'react';
import { VariableState } from '@/types/gherkin';

interface VariablesPanelProps {
  variables: VariableState[];
}

export const VariablesPanel: FC<VariablesPanelProps> = ({ variables }) => {
  if (variables.length === 0) return null;

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-white mb-2">Variables</h3>
      <ul className="space-y-1">
        {variables.map((variable) => (
          <li key={variable.name} className="text-sm text-gray-300">
            <span className="font-medium text-white">{variable.name}:</span> {variable.current}
          </li>
        ))}
      </ul>
    </div>
  );
}; 