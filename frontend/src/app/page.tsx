'use client'

import { useState, useRef } from 'react';
import { PseudoCodeViewer } from '@/components/CodeViewer/PseudoCodeViewer';
import { GherkinFeatureViewer } from '@/components/CodeViewer/GherkinFeatureViewer';
import { GherkinJSONViewer } from '@/components/CodeViewer/GherkinJSONViewer';
import { GitFeatureContent } from '@/types/gherkin';

export default function Home() {
  const [fileType, setFileType] = useState<'pseudo' | 'gherkin' | 'debug-info-json' | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [parsedGitContent, setParsedGitContent] = useState<GitFeatureContent | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      const content = await file.text();
      
      if (extension === 'pseudo') {
        setFileContent(content);
        setFileType('pseudo');
        setParsedGitContent(null);
      } else if (extension === 'feature' || extension === 'gherkin') {
        setFileContent(content);
        setFileType('gherkin');
        setParsedGitContent(null);
      } else if (extension === 'json') {
        // Validate if it's a debug info JSON
        try {
          const parsedContent = JSON.parse(content);
          if (parsedContent.feature && parsedContent.feature.categories) {
            setParsedGitContent(parsedContent.feature);
            setFileType('debug-info-json');
            setFileContent(null);
          } else {
            throw new Error('Invalid debug info format');
          }
        } catch (err) {
          alert('Invalid debug info JSON format. Please check the file structure.');
          resetState();
          return;
        }
      } else {
        alert('Unsupported file type. Please upload a .pseudo, .feature, or debug info .json file.');
        resetState();
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try again.');
      resetState();
    }
  };

  const resetState = () => {
    setFileType(null);
    setFileContent(null);
    setParsedGitContent(null);
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderViewer = () => {
    switch (fileType) {
      case 'pseudo':
        return fileContent && (
          <PseudoCodeViewer 
            initialContent={fileContent} 
            onReset={resetState}
          />
        );
      case 'gherkin':
        return fileContent && (
          <GherkinFeatureViewer 
            initialContent={fileContent} 
            onReset={resetState}
          />
        );
      case 'debug-info-json':
        return parsedGitContent && (
          <GherkinJSONViewer 
            content={parsedGitContent}
            onReset={resetState}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-900">
      {!fileType ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-2xl w-full p-8">
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">DebugLens</h1>
                <p className="text-lg text-gray-400">
                  Interactive Code Learning & Debugging Assistant
                </p>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">Get Started</h2>
                    <p className="text-gray-400">Choose how you want to explore code:</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <button 
                      className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-left"
                      onClick={() => {/* TODO: Implement AI chat */}}
                    >
                      <h3 className="font-medium text-blue-400">Ask AI Assistant</h3>
                      <p className="text-sm text-gray-400">Get explanations by asking questions about code</p>
                    </button>

                    <div 
                      className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <h3 className="font-medium text-blue-400">Open Debug File</h3>
                      <p className="text-sm text-gray-400">Load a compatible debug info file</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pseudo,.feature,.gherkin,.json"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Supported formats: .pseudo, .feature, .gherkin, debug info .json
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderViewer()}
        </div>
      )}
    </div>
  );
}
