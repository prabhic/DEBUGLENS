import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface CodeBlockProps {
  code: string[];
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ 
  code, 
  language = 'typescript'
}) => {
  return (
    <div className="font-mono bg-gray-900 rounded-lg overflow-hidden">
      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
        <SyntaxHighlighter 
          language={language} 
          style={okaidia} 
          customStyle={{ margin: 0, padding: '1rem' }}
        >
          {code.join('\n')}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}; 