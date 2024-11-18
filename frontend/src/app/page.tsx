'use client'

import { useState, useRef, useEffect } from 'react';
import { GherkinJSONViewer } from '@/components/CodeViewer/GherkinJSONViewer';
import { GherkinJSONAsyncViewer } from '@/components/CodeViewer/GherkinJSONAsyncViewer';
import { FeatureContent } from '@/types/gherkin';
import { AIChatDialog } from '@/components/Chat/AIChatDialog';
import { 
  Code2, 
  GitBranch, 
  Box, 
  Upload,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLinux, 
  faGitAlt, 
  faReact,  // for TensorFlow (using React as placeholder)
  faJs,      // for Qt (using JS as placeholder)
  faDocker,
  faNodeJs
} from '@fortawesome/free-brands-svg-icons';
import { 
  faDatabase,
  faCloud
} from '@fortawesome/free-solid-svg-icons';
import { generateGherkinFile, generateDebugInfoJson, generateDebugInfoJsonAsync } from '@/services/fileGenerationService';
import { setFeatureContent } from '@/services/debugDataService';
import { isFeatureEnabled } from '@/config/features';
import { DebugLensIcon } from '@/components/Icons/DebugLensIcon';
import { AsyncDebugProvider } from '@/contexts/AsyncDebugContext';
import { useRouter, useSearchParams } from 'next/navigation';

// Quick start options
const QUICK_START_OPTIONS = [
  {
    title: "Explore Linux Kernel",
    description: "Dive into core kernel concepts and structures",
    icon: Code2,
    action: "linux"
  },
  {
    title: "Analyze Git Internals",
    description: "Understand Git's internal mechanisms",
    icon: GitBranch,
    action: "git"
  },
  {
    title: "Load Custom Codebase",
    description: "Debug and explore your own code",
    icon: Upload,
    action: "custom"
  },
  {
    title: "Browse Templates",
    description: "Start with predefined code structures",
    icon: Box,
    action: "templates"
  }
];

// Famous codebases
const FAMOUS_CODEBASES = [
  { name: "Linux", icon: "/icons/linux.svg" },
  { name: "Git", icon: "/icons/git.svg" },
  { name: "Qt", icon: "/icons/qt.svg" },
  { name: "TensorFlow", icon: "/icons/tensorflow.svg" },
  // Add more as needed
];

// Define suggestion options with their icons
const EXPLORE_SUGGESTIONS = [
  {
    name: "Linux Memory Allocation",
    description: "What happens internally when an application requests memory from Linux?",
    icon: faLinux
  },
  {
    name: "Git Commit Process",
    description: "What happens behind the scenes when you run 'git commit'?",
    icon: faGitAlt
  },
  {
    name: "Docker Container Creation",
    description: "What happens internally when you run 'docker run'?",
    icon: faDocker
  },
  {
    name: "Kubernetes Pod Deployment",
    description: "What happens internally when you deploy a new pod to Kubernetes?",
    icon: faCloud
  },
  {
    name: "Redis Data Storage",
    description: "What happens internally when Redis stores and retrieves data?",
    icon: faDatabase
  },
  {
    name: "Node.js Request Handling",
    description: "What happens internally when Node.js receives an HTTP request?",
    icon: faNodeJs
  },
  {
    name: "React State Update",
    description: "What happens internally when you call setState in React?",
    icon: faReact
  },
  {
    name: "PostgreSQL Query Execution",
    description: "What happens internally when PostgreSQL executes your SQL query?",
    icon: faDatabase
  }
];

// Add new loading component
const DebugLoadingAnimation = () => (
  <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700">
      <div className="space-y-6">
        {/* Animation container */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            {/* Circular progress */}
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            {/* Debug icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none">
                <path d="M12 4V4C8 4 4 8 4 12V12C4 16 8 20 12 20V20C16 20 20 16 20 12V12C20 8 16 4 12 4Z" 
                      stroke="currentColor" strokeWidth="2"/>
                <path d="M15 12L12 12M12 12L9 12M12 12L12 9M12 12L12 15" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="text-center space-y-3">
          <h3 className="text-lg font-semibold text-white">Generating Debug Information</h3>
          <p className="text-sm text-gray-400">
            Our AI is analyzing your scenario and creating detailed debugging steps...
          </p>
        </div>

        {/* Animated progress steps */}
        <div className="space-y-2">
          {['Analyzing context', 'Building debug flow', 'Preparing variables'].map((step, index) => (
            <div key={step} 
                 className={`flex items-center space-x-3 text-sm
                   ${index === 0 ? 'text-blue-400' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full
                ${index === 0 ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'}`}></div>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Add type for the API response
interface DebugInfoResponse {
  feature?: FeatureContent;
  error?: string;
}

export default function Home() {
  const [fileType, setFileType] = useState<'pseudo' | 'gherkin' | 'debug-info-json' | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [debugInfoJsonParsed, setDebugInfoJsonParsed] = useState<FeatureContent | null>(null);
  const [inputValue, setInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAsyncMode, setIsAsyncMode] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check for Ctrl+L (Chat)
      if (event.ctrlKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        setIsAIChatOpen(prev => !prev);
      }
      
      // Check for Ctrl+O (Open file)
      if (event.ctrlKey && event.key.toLowerCase() === 'o') {
        event.preventDefault();
        fileInputRef.current?.click();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Add effect to watch URL changes and update state accordingly
  useEffect(() => {
    const view = searchParams.get('view');
    
    // If no view parameter is present, reset to home
    if (!view) {
      setFileType(null);
      setFileContent(null);
      setDebugInfoJsonParsed(null);
      setError(null);
      setIsLoading(false);
      setIsAIChatOpen(false);
    }
  }, [searchParams]); // This will run whenever the URL parameters change

  // Update resetState to handle history
  const resetState = () => {
    // Remove any query parameters and update URL
    router.push('/', { scroll: false });
    
    // Reset all state
    setFileType(null);
    setFileContent(null);
    setDebugInfoJsonParsed(null);
    setError(null);
    setIsLoading(false);
    setIsAIChatOpen(false);
  };

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
        setDebugInfoJsonParsed(null);
      } else if (extension === 'feature' || extension === 'gherkin') {
        setFileContent(content);
        setFileType('gherkin');
        setDebugInfoJsonParsed(null);
      } else if (extension === 'json') {
        try {
          const parsedContent = JSON.parse(content);
          if (parsedContent.feature && parsedContent.feature.categories) {
            console.log('[Page] Parsed JSON:', { parsedContent });
            setDebugInfoJsonParsed(parsedContent.feature);
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

    // Add history entry when switching to viewer
    router.push('/?view=file', { scroll: false });
  };

  const renderViewer = () => {
    switch (fileType) {
      case 'pseudo':
        return fileContent && (
          <div className="w-full h-full overflow-auto">
            <pre className="p-4 text-gray-300">{fileContent}</pre>
          </div>
        );

      case 'gherkin':
        return fileContent && (
          <div className="w-full h-full overflow-auto">
            <pre className="p-4 text-gray-300">{fileContent}</pre>
          </div>
        );

      case 'debug-info-json':
        return debugInfoJsonParsed && (
          isAsyncMode ? (
            <GherkinJSONAsyncViewer 
              content={debugInfoJsonParsed}
              onReset={resetState}
              onOpenAIChat={() => setIsAIChatOpen(true)}
              isAsyncMode={isAsyncMode}
            />
          ) : (
            <GherkinJSONViewer
              content={debugInfoJsonParsed}
              onReset={resetState}
              onOpenAIChat={() => setIsAIChatOpen(true)}
              isAsyncMode={isAsyncMode}
            />
          )
        );
      default:
        return null;
    }
  };

  // Update handlers to add history entries
  const handleGherkinGenerate = async (prompt: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const gherkinContent = await generateGherkinFile(prompt);
      setFileContent(gherkinContent);
      setFileType('gherkin');

      // Add history entry when switching to viewer
      router.push('/?view=gherkin', { scroll: false });

    } catch (error) {
      console.error('Error generating Gherkin:', error);
      setError('Failed to generate Gherkin. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJsonGenerate = async (prompt: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[Page] Generating JSON:', { prompt });

      const response = await generateDebugInfoJson(prompt) as DebugInfoResponse;
      if ('error' in response) {
        throw new Error(response.error as string);
      }
      
      if (!response.feature) {
        throw new Error('No feature content received');
      }
      
      setDebugInfoJsonParsed(response.feature as FeatureContent);
      setFileType('debug-info-json');
      setFileContent(null);

      // Add history entry when switching to viewer
      router.push('/?view=debug', { scroll: false });

    } catch (error) {
      console.error('Error generating JSON:', error);
      setError('Failed to generate JSON. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJsonGenerateAsync = async (prompt: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[Page] Generating JSON Async:', { prompt });

      const response = await generateDebugInfoJsonAsync(prompt);
      console.log('[Page] Received JSON Async response:', { 
        sessionId: response.sessionId,
        contentStructure: {
          scenarios: response.content.scenarios?.length,
          firstScenario: response.content.scenarios?.[0],
          steps: response.content.scenarios?.[0]?.steps
        }
      });
      
      // Initialize the debug data service cache
      if (!response.content) {
        throw new Error('No content received from API');
      }
      
      setFeatureContent(response.content);
      console.log('[Page] Initialized feature content cache');
      
      setIsAsyncMode(true);
      setDebugInfoJsonParsed(response.content);
      setFileType('debug-info-json');
      setFileContent(null);

      router.push('/?view=debug', { scroll: false });
    } catch (error) {
      console.error('[Page] Error generating JSON:', error);
      setError('Failed to generate JSON. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPromptForm = () => {
    const hasInput = inputValue.trim().length > 0;

    return (
      <div className="space-y-2">
        <form 
          className="relative"
          onSubmit={(e) => e.preventDefault()}
        >
          <textarea
            placeholder="Enter a scenario or topic to explore and debug (e.g., 'Linux Kernel - Process Switching', 'Git - Commit Workflow')"
            className="w-full h-40 bg-gray-900 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            disabled={isLoading}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-3">
            {/* Async Mode Toggle */}
            <label className="inline-flex items-center cursor-pointer">
              <span className="mr-2 text-sm text-gray-400">Async</span>
              <div className="relative">
                <input 
                  type="checkbox"
                  className="sr-only peer"
                  checked={isAsyncMode}
                  onChange={(e) => setIsAsyncMode(e.target.checked)}
                />
                <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>

            {/* Submit Button */}
            <button 
              onClick={() => {
                if (inputValue.trim()) {
                  isAsyncMode ? handleJsonGenerateAsync(inputValue.trim()) : handleJsonGenerate(inputValue.trim());
                }
              }}
              disabled={isLoading || !hasInput}
              className={`p-2 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200
                ${isLoading 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                  : hasInput
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600 shadow-lg'
                    : 'bg-gray-800 text-gray-600'}`}
              title="Start Debugging"
            >
              {isLoading ? (
                <span>...</span>
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderLandingPage = () => {
    const hasInput = inputValue.trim().length > 0;

    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="fixed top-6 left-6 flex items-center gap-6">
          <button
            onClick={resetState}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <DebugLensIcon className="w-6 h-6" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 text-transparent bg-clip-text">
              DebugLens
            </span>
          </button>
        </div>

        <div className="max-w-4xl w-full space-y-8">
          {/* Main Heading */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold text-white">
              What do you want to Explore?
            </h1>
            <p className="text-xl text-gray-400">
            Dive into famous codebases or debug your own with AI-powered code abstraction.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Input Prompt Box */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            {renderPromptForm()}
          </div>

          {/* Suggestions Section */}
          <div className="space-y-6">
            {/* Famous Codebases Section Title */}
            <div className="flex items-center justify-center gap-4">
              <div className="h-px bg-gray-700/50 w-24"></div>
              <span className="text-xs text-gray-500">quick starts</span>
              <div className="h-px bg-gray-700/50 w-24"></div>
            </div>

            {/* Suggestion Links */}
            <div className="flex flex-wrap justify-center gap-4 max-w-xl mx-auto">
              {EXPLORE_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.name}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                  onClick={() => setInputValue(`Explain ${suggestion.name} ${suggestion.description}`)}
                >
                  <FontAwesomeIcon 
                    icon={suggestion.icon} 
                    className="w-4 h-4 text-gray-500"
                  />
                  <span>{suggestion.name}</span>
                </button>
              ))}
            </div>

            {/* Divider for Custom Codebase */}
            <div className="flex items-center justify-center gap-4">
              <div className="h-px bg-gray-700 w-32"></div>
              <span className="text-sm text-gray-500">or</span>
              <div className="h-px bg-gray-700 w-32"></div>
            </div>

            {/* Load Custom Codebase Button Section */}
            <div className="flex justify-center gap-4">
              {isFeatureEnabled('LOAD_CUSTOM_CODEBASE') && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 px-6 py-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors text-white group"
                >
                  <Upload className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
                  <div className="text-left">
                    <div className="font-medium">Load Custom Codebase</div>
                    <div className="text-sm text-gray-400">Debug and explore your own code</div>
                  </div>
                </button>
              )}

              {isFeatureEnabled('GENERATE_DEBUG_SCENARIO') && (
                <button
                  onClick={() => {
                    if (inputValue.trim()) {
                      handleGherkinGenerate(inputValue.trim());
                    }
                  }}
                  disabled={isLoading || !hasInput}
                  className="flex items-center gap-3 px-6 py-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors text-white group"
                >
                  <MessageSquare className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
                  <div className="text-left">
                    <div className="font-medium">Generate Debug Scenario</div>
                    <div className="text-sm text-gray-400">Create behavior scenarios</div>
                  </div>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pseudo,.feature,.gherkin,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Help Links */}
          <div className="flex justify-center gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white">Documentation</a>
            <a href="#" className="text-gray-400 hover:text-white">Learn DebugLens</a>
            <a href="#" className="text-gray-400 hover:text-white">Get Support</a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AsyncDebugProvider isAsyncMode={isAsyncMode}>
      <div className="h-screen flex flex-col overflow-hidden bg-gray-900">
        {isLoading && <DebugLoadingAnimation />}

        {!fileType ? renderLandingPage() : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {renderViewer()}
          </div>
        )}

        <AIChatDialog 
          isOpen={isAIChatOpen} 
          onClose={() => setIsAIChatOpen(false)}
          shortcutHint="Ctrl+L"
        />
      </div>
    </AsyncDebugProvider>
  );  
}
