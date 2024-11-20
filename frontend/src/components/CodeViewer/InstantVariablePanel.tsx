import React from 'react';

interface DataStructureState {
  name: string;
  state: string;
  values: string[];
}

interface InstantVariablePanelProps {
  variables: {
    before?: DataStructureState;
    after?: DataStructureState;
    changes?: string[];
  };
  isLoading?: boolean;
}

export const InstantVariablePanel: React.FC<InstantVariablePanelProps> = ({ 
  variables,
  isLoading = false 
}) => {
  if (!variables.before || !variables.after) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        {isLoading ? "Loading state changes..." : "No state changes available"}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none p-4 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300">Data Structure State</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Before State */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h4 className="text-sm font-medium text-gray-400">
              Before: {variables.before.name}
            </h4>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-2">{variables.before.state}</div>
            <div className="space-y-1 font-mono">
              {variables.before.values.map((value, idx) => (
                <div key={idx} className="text-sm text-gray-300">
                  {value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* After State */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h4 className="text-sm font-medium text-gray-400">
              After: {variables.after.name}
            </h4>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-2">{variables.after.state}</div>
            <div className="space-y-1 font-mono">
              {variables.after.values.map((value, idx) => (
                <div key={idx} className="text-sm text-gray-300">
                  {value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Changes */}
        {variables.changes && variables.changes.length > 0 && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <h4 className="text-sm font-medium text-gray-400">Changes Made</h4>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="space-y-1">
                {variables.changes.map((change, idx) => (
                  <div key={idx} className="text-sm text-yellow-500">
                    • {change}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 