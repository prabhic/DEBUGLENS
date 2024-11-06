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
    <div className="h-screen flex flex-col">
      {!fileType && (
        <div className="flex-1 flex items-center justify-center bg-gray-900">
          <div className="text-center p-8 rounded-lg">
            <h1 className="text-2xl font-bold text-white mb-6">DebugLens</h1>
            <p className="text-gray-400 mb-4">Upload a file to start debugging</p>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pseudo,.feature,.gherkin,.json"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0 file:text-sm file:font-semibold
                  file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600
                  cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                Supported formats: .pseudo, .feature, .gherkin, debug info .json
              </p>
            </div>
          </div>
        </div>
      )}
      
      {renderViewer()}
    </div>
  );
}
