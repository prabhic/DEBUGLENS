import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { CodeBlock } from './CodeBlock';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { InformationCircleIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline';

interface DebugStepCardProps {
  stepId: string;
  step: {
    status: 'generating' | 'ready' | 'error';
    name: string;
    code: {
      initial: string[];
    };
    concepts: {
      quick: string;
      detailed?: {
        explanation: string[];
        impact: string;
      };
      dataStructures?: string[];
      algorithms?: string[];
    };
  };
  isActive: boolean;
  onClick: () => void;
}

export const DebugStepCard: React.FC<DebugStepCardProps> = ({
  stepId,
  step,
  isActive,
  onClick,
}) => {
  const [isCodeExpanded, setIsCodeExpanded] = useState(true);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  return (
    <div 
      className={`
        group bg-gray-800 rounded-lg transition-all duration-200 ease-in-out
        hover:bg-gray-750 cursor-pointer
        ${isActive ? 'border-l-4 border-blue-500 shadow-lg' : 'border-l-4 border-gray-700'}
      `}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-medium text-blue-400 flex items-center gap-2">
            {stepId === 'overview' ? 'Implementation Overview' : step.name}
            {step.status === 'generating' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-200">
                Analyzing...
              </span>
            )}
          </h4>
          {/* Status Icon */}
          {step.status === 'generating' && (
            <InformationCircleIcon className="w-5 h-5 text-blue-400" />
          )}
        </div>

        {/* Key Data Structures */}
        {step.concepts.dataStructures && (
          <div className="flex items-center gap-2 mt-2">
            <PuzzlePieceIcon className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-300">Key Data Structures</span>
          </div>
        )}

        {/* Key Algorithms */}
        {step.concepts.algorithms && (
          <div className="flex items-center gap-2 mt-2">
            <PuzzlePieceIcon className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-300">Key Algorithms</span>
          </div>
        )}

        {/* Simplified Code Section */}
        <div className="mt-4">
          <div 
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsCodeExpanded(!isCodeExpanded);
            }}
          >
            {isCodeExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          {isCodeExpanded && (
            <CodeBlock 
              code={step.code.initial} 
              language="typescript" 
            />
          )}
        </div>

        {/* Explanation Section */}
        <div className="mt-4">
          <div 
            className="flex items-center gap-2 text-sm text-gray-400 mb-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsDetailsExpanded(!isDetailsExpanded);
            }}
          >
            {isDetailsExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
            <span>Step Explanation</span>
          </div>

          {isDetailsExpanded && step.concepts.detailed && (
            <div className="text-sm text-gray-400 space-y-2 mt-2">
              {step.concepts.detailed.explanation.map((point, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-2"
                >
                  <span className="text-blue-400 mt-1">•</span>
                  <span>{point}</span>
                </div>
              ))}
              <div className="text-green-400 mt-2 pl-4">
                {step.concepts.detailed.impact}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 