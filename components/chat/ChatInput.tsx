'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/hooks/useSearch';
import { Send, Code, FileEdit, BookOpen, Edit3, ShoppingCart, Square, Mic, MicOff } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  onCategorySelect?: (category: string) => void;
  onStop?: () => void;
  isGenerating?: boolean;
}

type Category = 'code' | 'create' | 'learn' | 'write' | 'life';

export function ChatInput({ onSend, disabled, onCategorySelect, onStop, isGenerating = false }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'general' | 'person'>('general');
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const { data: searchResults } = useSearch(searchQuery, searchType);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  useEffect(() => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = input.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1 && (lastAtIndex === 0 || /\s/.test(textBeforeCursor[lastAtIndex - 1]))) {
      const queryAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!queryAfterAt.includes(' ')) {
        setSearchQuery(queryAfterAt);
        setSearchType('person');
        setMentionStart(lastAtIndex);
        setShowAutocomplete(true);
        setSelectedIndex(0);
        return;
      }
    }

    // Disable general autocomplete - only show for @ mentions
    setShowAutocomplete(false);
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
      setShowAutocomplete(false);
      setMentionStart(-1);
      setSelectedCategory(null);
    }
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // TODO: Handle file upload
      console.log('Files selected:', files);
      // Reset input to allow selecting same file again
      e.target.value = '';
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');

          setInput(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const selectResult = (text: string) => {
    if (mentionStart !== -1) {
      const before = input.slice(0, mentionStart);
      const cursorPos = textareaRef.current?.selectionStart || 0;
      const after = input.slice(cursorPos);
      setInput(before + text + ' ' + after);
      setMentionStart(-1);
    } else {
      setInput(text);
    }
    setShowAutocomplete(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showAutocomplete && searchResults && searchResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % searchResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        selectResult(searchResults[selectedIndex].text);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutocomplete(false);
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !showAutocomplete) {
      e.preventDefault();
      handleSend();
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <strong className="font-semibold">{text.slice(index, index + query.length)}</strong>
        {text.slice(index + query.length)}
      </>
    );
  };

  const categories = [
    { id: 'code' as Category, label: 'Code', icon: Code },
    { id: 'create' as Category, label: 'Create', icon: FileEdit },
    { id: 'learn' as Category, label: 'Learn', icon: BookOpen },
    { id: 'write' as Category, label: 'Write', icon: Edit3 },
    { id: 'life' as Category, label: 'Life stuff', icon: ShoppingCart },
  ];

  return (
    <div className="relative w-full max-w-full box-border">
      {showAutocomplete && searchResults && searchResults.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-[#ddd9d3] rounded-xl shadow-lg max-h-64 overflow-auto">
          {searchResults.map((result, index) => (
            <button
              key={result.id}
              onClick={() => selectResult(result.text)}
              className={`w-full px-4 py-3 text-left text-[15px] hover:bg-[#f5f3ef] transition-colors first:rounded-t-xl last:rounded-b-xl ${
                index === selectedIndex ? 'bg-[#f5f3ef]' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {result.type === 'person' && (
                  <div className="w-7 h-7 rounded-full bg-[#e8e5e0] flex items-center justify-center text-xs font-medium text-[#2b2622]">
                    {result.text.charAt(0)}
                  </div>
                )}
                <span className="text-[#2b2622]">{highlightMatch(result.text, searchQuery)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="relative bg-white rounded-2xl shadow-sm border border-[#ddd9d3] max-w-full box-border">
        {selectedCategory && (
          <div className="px-4 pt-3 pb-2 border-b border-[#e8e5e0]">
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 bg-[#f5f3ef] text-[#2b2622] rounded-md flex items-center gap-1.5">
                {categories.find(c => c.id === selectedCategory)?.icon && (
                  (() => {
                    const Icon = categories.find(c => c.id === selectedCategory)!.icon;
                    return <Icon className="h-3.5 w-3.5" />;
                  })()
                )}
                {categories.find(c => c.id === selectedCategory)?.label}
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="ml-1 hover:bg-[#e8e5e0] rounded-sm p-0.5"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            </div>
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Listening...' : 'How can I help you today?'}
          disabled={disabled}
          rows={1}
          className="w-full px-4 md:px-6 py-4 pr-28 md:pr-32 bg-transparent resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-[16px] leading-7 text-[#2b2622] placeholder:text-[#6b6560]"
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.txt"
        />
        <div className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 md:gap-2">
          <button
            onClick={handleFileClick}
            className="p-2 hover:bg-[#f5f3ef] rounded-lg transition-colors text-[#6b6560]"
            title="Upload files"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={toggleVoiceInput}
            className={`p-2 hover:bg-[#f5f3ef] rounded-lg transition-colors ${
              isListening ? 'text-[#cc785c] bg-[#f5f3ef]' : 'text-[#6b6560]'
            }`}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          {/* <button className="p-2 hover:bg-[#f5f3ef] rounded-lg transition-colors text-[#6b6560]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-[#f5f3ef] rounded-lg transition-colors text-[#6b6560]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <div className="flex items-center gap-1 text-sm text-[#6b6560] mr-2">
            <span>Sonnet 4.5</span>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div> */}
          {isGenerating && onStop ? (
            <button
              onClick={onStop}
              className="p-2.5 rounded-lg bg-[#2b2622] text-white hover:bg-[#1a1410] transition-colors"
              title="Stop generating"
            >
              <Square className="h-5 w-5 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || disabled}
              className="p-2.5 rounded-lg bg-[#cc785c] text-white disabled:bg-[#e8e5e0] disabled:text-[#6b6560] hover:bg-[#b86a4f] transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
