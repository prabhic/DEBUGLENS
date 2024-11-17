import React, { FC } from 'react';

interface ConceptsPanelProps {
  concepts: {
    title: string;
    points: string[];
    focus: string;
  };
}

export const ConceptsPanel: FC<ConceptsPanelProps> = ({ concepts }) => {
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