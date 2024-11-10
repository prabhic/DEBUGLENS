import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Switch } from '@/components/ui/switch';
import { sendMessage } from '@/services/chatService';
import type { ChatMessage } from '@/types/chat';

interface AIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shortcutHint?: string;
}

const FOCUS_DELAY_MS = 100;

export function AIChatDialog({ isOpen, onClose, shortcutHint }: AIChatDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingEnabled, setStreamingEnabled] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const focusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, FOCUS_DELAY_MS);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      focusInput();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isLoading) {
      focusInput();
    }
  }, [isOpen, isLoading, messages]);

  const handleStreamingResponse = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage) {
            lastMessage.content += chunk;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error reading stream:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = inputValue.trim();
    
    if (!trimmedInput || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmedInput,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      if (streamingEnabled) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '',
        }]);

        const stream = await sendMessage(userMessage.content, true);
        const reader = stream?.getReader();
        
        if (!reader) {
          throw new Error('No stream reader available');
        }

        await handleStreamingResponse(reader);
      } else {
        const response = await sendMessage(userMessage.content);
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.message,
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
      focusInput();
    }
  };

  const renderMessage = (content: string, role: ChatMessage['role']) => {
    if (role === 'user') {
      return <div className="whitespace-pre-wrap">{content}</div>;
    }

    return (
      <ReactMarkdown 
        className="prose prose-invert max-w-none"
        components={{
          pre: ({ children }) => (
            <div className="overflow-auto my-2 bg-gray-900 p-2 rounded">
              <pre>{children}</pre>
            </div>
          ),
          code({ children, className, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return (
              <code className="bg-gray-900 px-1 py-0.5 rounded" {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl h-[600px] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
            {shortcutHint && (
              <span className="text-xs text-gray-400 px-2 py-1 bg-gray-700 rounded">
                {shortcutHint}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-700">
          <span className="text-sm text-gray-400">Enable streaming</span>
          <Switch
            checked={streamingEnabled}
            onCheckedChange={setStreamingEnabled}
            aria-label="Toggle streaming mode"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                {renderMessage(message.content, message.role)}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}