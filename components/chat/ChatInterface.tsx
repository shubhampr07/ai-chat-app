'use client';

import { useRef, useEffect, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { StickyHeader } from './StickyHeader';
import { Code, ChevronDown, Share2, FileEdit, BookOpen, Edit3, ShoppingCart, Menu, Loader2 } from 'lucide-react';

type Category = 'code' | 'create' | 'learn' | 'write' | 'life';

interface ChatInterfaceProps {
  onOpenSidebar?: () => void;
}

export function ChatInterface({ onOpenSidebar }: ChatInterfaceProps) {
  const {
    activeSession,
    activeSessionId,
    username,
    streamMessage,
    stopGenerating,
    regenerateMessage,
    editPrompt,
    updateMessageFollowUps,
  } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const userMessageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [visibleQuestion, setVisibleQuestion] = useState<string | null>(null);
  const [loadingFollowUpsForMessage, setLoadingFollowUpsForMessage] = useState<string | null>(null);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) return 'Hello night owl';
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Track when new messages are added - scroll new question to top
  useEffect(() => {
    if (activeSession?.messages) {
      const currentCount = activeSession.messages.length;

      // If message count increased (new message added)
      if (currentCount > messageCount) {
        // Find the latest user message and scroll it to the top
        setTimeout(() => {
          if (latestMessageRef.current && scrollRef.current) {
            const headerHeight = 60; // Approximate height of sticky header
            const scrollContainer = scrollRef.current;
            const messageElement = latestMessageRef.current;

            // Calculate position to scroll the new question to just below the header
            const containerTop = scrollContainer.getBoundingClientRect().top;
            const messageTop = messageElement.getBoundingClientRect().top;
            const currentScrollTop = scrollContainer.scrollTop;

            // Scroll so the new question appears right below the sticky header
            const targetScrollTop = currentScrollTop + (messageTop - containerTop) - headerHeight;

            scrollContainer.scrollTo({
              top: targetScrollTop,
              behavior: 'smooth'
            });
          }
        }, 100);

        setMessageCount(currentCount);
        setUserHasScrolled(false);
      }
    }
  }, [activeSession?.messages, messageCount]);

  // Legacy auto-scroll for streaming updates (only if near bottom)
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    // Check if user is near bottom before auto-scrolling
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

    // Only auto-scroll if user is near the bottom during streaming
    if (isNearBottom && !userHasScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.messages, userHasScrolled]);

  // Track visible question on scroll (including when viewing answer)
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || !activeSession?.messages) return;

    const updateVisibleQuestion = () => {
      const containerRect = scrollContainer.getBoundingClientRect();
      const viewportCenter = containerRect.top + containerRect.height / 2;

      let closestQuestion = null;
      let closestDistance = Infinity;

      userMessageRefs.current.forEach((element) => {
        const rect = element.getBoundingClientRect();

        // Check if this message or its answer pair is visible
        // Look ahead to include the answer that follows this question
        const nextSibling = element.nextElementSibling;
        const answerRect = nextSibling?.getBoundingClientRect();

        // Check if question OR its answer is in viewport
        const questionVisible = rect.top < containerRect.bottom && rect.bottom > containerRect.top;
        const answerVisible = answerRect && answerRect.top < containerRect.bottom && answerRect.bottom > containerRect.top;

        if (questionVisible || answerVisible) {
          const content = element.getAttribute('data-content');
          if (content) {
            // Calculate distance from viewport center
            // Use question's top position for consistency
            const distance = Math.abs(rect.top - viewportCenter);

            if (distance < closestDistance) {
              closestDistance = distance;
              closestQuestion = content;
            }
          }
        }
      });

      if (closestQuestion) {
        setVisibleQuestion(closestQuestion);
      }
    };

    // Update on scroll
    scrollContainer.addEventListener('scroll', updateVisibleQuestion);
    // Initial update
    updateVisibleQuestion();

    return () => {
      scrollContainer.removeEventListener('scroll', updateVisibleQuestion);
    };
  }, [activeSession?.messages]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      // Clear previous timeout
      clearTimeout(scrollTimeout);

      // Set timeout to detect if user has stopped scrolling
      scrollTimeout = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        // If user is at or near bottom (within 150px), enable auto-scroll
        if (distanceFromBottom < 150) {
          setUserHasScrolled(false);
        } else {
          // User has scrolled up significantly
          setUserHasScrolled(true);
        }
      }, 100);
    };

    const handleWheel = () => {
      // Immediately detect scroll up attempt
      setUserHasScrolled(true);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    scrollContainer.addEventListener('wheel', handleWheel);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      scrollContainer.removeEventListener('wheel', handleWheel);
      clearTimeout(scrollTimeout);
    };
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchSuggestions(selectedCategory);
    } else {
      setSuggestions([]);
    }
  }, [selectedCategory]);

  // Fetch follow-up questions when an assistant message finishes streaming
  useEffect(() => {
    if (!activeSession?.messages || activeSession.messages.length < 2) return;

    const lastMessage = activeSession.messages[activeSession.messages.length - 1];
    const secondLastMessage = activeSession.messages[activeSession.messages.length - 2];

    // Check if the last message is an assistant message that just finished streaming
    if (
      lastMessage.role === 'assistant' &&
      !lastMessage.isStreaming &&
      lastMessage.content &&
      !lastMessage.followUpQuestions &&
      secondLastMessage.role === 'user'
    ) {
      // Fetch follow-up questions only for the latest message
      fetchFollowUpQuestions(
        secondLastMessage.content,
        lastMessage.content,
        lastMessage.id
      );
    }
  }, [activeSession?.messages]);

  const fetchSuggestions = async (category: Category) => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch(`/api/suggestions?category=${category}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSend = async (message: string) => {
    if (activeSessionId) {
      // Close category suggestions when sending a message
      setSelectedCategory(null);
      setSuggestions([]);
      await streamMessage(activeSessionId, message);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category as Category);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSelectedCategory(null);
    setSuggestions([]);
    handleSend(suggestion);
  };

  const handleRegenerate = async (messageId: string) => {
    if (activeSessionId) {
      await regenerateMessage(activeSessionId, messageId);
    }
  };

  const handleEdit = async (messageId: string, newPrompt: string) => {
    if (activeSessionId) {
      await editPrompt(activeSessionId, messageId, newPrompt);
    }
  };

  const fetchFollowUpQuestions = async (userMessageContent: string, assistantMessageContent: string, messageId: string) => {
    if (!activeSessionId) return;

    setLoadingFollowUpsForMessage(messageId);
    try {
      const response = await fetch('/api/followup-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userQuestion: userMessageContent,
          aiResponse: assistantMessageContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.questions && data.questions.length > 0) {
          await updateMessageFollowUps(activeSessionId, messageId, data.questions);
        }
      }
    } catch (error) {
      console.error('Error fetching follow-up questions:', error);
    } finally {
      setLoadingFollowUpsForMessage(null);
    }
  };

  const handleFollowUpClick = (question: string) => {
    handleSend(question);
  };

  const truncateTitle = (text: string, maxLength: number = 35): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  if (!activeSession) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f5f3ef]">
        <Loader2 className="h-8 w-8 animate-spin text-[#cc785c]" />
      </div>
    );
  }

  const isStreaming = activeSession.messages.some(m => m.isStreaming);
  const hasMessages = activeSession.messages.length > 0;

  const categories = [
    { id: 'code' as Category, label: 'Code', icon: Code },
    { id: 'create' as Category, label: 'Create', icon: FileEdit },
    { id: 'learn' as Category, label: 'Learn', icon: BookOpen },
    { id: 'write' as Category, label: 'Write', icon: Edit3 },
    { id: 'life' as Category, label: 'Life stuff', icon: ShoppingCart },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f5f3ef] min-w-0 overflow-hidden">
      {hasMessages && (
        <div className="sticky top-0 z-40 bg-[#f5f3ef]/95 backdrop-blur-sm border-b border-[#ddd9d3] px-3 md:px-4 py-3 flex items-center justify-between w-full box-border">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={onOpenSidebar}
              className="md:hidden p-2 hover:bg-white/50 rounded-lg transition-colors -ml-2"
              title="Menu"
            >
              <Menu className="h-5 w-5 text-[#6b6560]" />
            </button>
            <h1 className="text-[15px] font-normal text-[#2b2622] truncate">
              {truncateTitle(visibleQuestion || activeSession.title)}
            </h1>
            <ChevronDown className="h-4 w-4 text-[#6b6560] flex-shrink-0" />
          </div>
          <button className="flex items-center gap-2 px-2 md:px-3 py-1.5 text-sm text-[#2b2622] hover:bg-white/50 rounded-lg transition-colors flex-shrink-0">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-[#f5f3ef] overflow-x-hidden relative" ref={scrollRef}>
        {!hasMessages ? (
          <div className="h-full flex flex-col items-center justify-center px-4 pb-32">
            {/* Mobile menu button - absolute positioned */}
            <button
              onClick={onOpenSidebar}
              className="md:hidden fixed top-4 left-4 p-2 bg-white hover:bg-[#e8e5e0] rounded-lg transition-colors shadow-sm z-10"
              title="Menu"
            >
              <Menu className="h-5 w-5 text-[#6b6560]" />
            </button>

            <div className="max-w-2xl w-full text-center space-y-8">
              <div className="space-y-3">
                <h1 className="text-[28px] sm:text-[36px] font-normal text-[#2b2622] leading-tight flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                  <span className="text-[#cc785c] text-3xl sm:text-4xl">✳</span>
                  <span className="whitespace-nowrap">{getGreeting()}{username && `, ${username}`}</span>
                </h1>
              </div>

              <div className="max-w-[680px] mx-auto space-y-3">
                <ChatInput
                  onSend={handleSend}
                  disabled={isStreaming}
                  onCategorySelect={handleCategorySelect}
                  onStop={stopGenerating}
                  isGenerating={isStreaming}
                />

                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors rounded-lg border ${
                          selectedCategory === category.id
                            ? 'bg-[#cc785c] text-white border-[#cc785c]'
                            : 'text-[#2b2622] hover:bg-white/50 border-[#ddd9d3]'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {category.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedCategory && (
                <div className="mt-6 space-y-3">
                  <p className="text-sm text-[#6b6560]">Suggested prompts:</p>
                  {loadingSuggestions ? (
                    <div className="grid grid-cols-1 gap-2 max-w-[680px] mx-auto">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="px-4 py-3 text-sm bg-white rounded-xl border border-[#ddd9d3] animate-pulse h-12"
                        />
                      ))}
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 max-w-[680px] mx-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-4 py-3 text-left text-sm text-[#2b2622] bg-white hover:bg-[#e8e5e0] rounded-xl transition-colors border border-[#ddd9d3]"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {activeSession.messages.map((message, index) => {
              // Add ref to the last two messages (user question + AI response)
              const isLatestPair = index >= activeSession.messages.length - 2;
              const isLastAssistantMessage = message.role === 'assistant' && index === activeSession.messages.length - 1;

              return (
                <div
                  key={message.id}
                  ref={(el) => {
                    if (isLatestPair && index === activeSession.messages.length - 2) {
                      latestMessageRef.current = el;
                    }
                    // Store ref for user messages for IntersectionObserver
                    if (message.role === 'user' && el) {
                      userMessageRefs.current.set(message.id, el);
                    }
                  }}
                  data-role={message.role}
                  data-content={message.role === 'user' ? message.content : undefined}
                >
                  <ChatMessage
                    message={message}
                    onRegenerate={
                      message.role === 'assistant' && !message.isStreaming
                        ? () => handleRegenerate(message.id)
                        : undefined
                    }
                    onEdit={
                      message.role === 'user'
                        ? (newPrompt) => handleEdit(message.id, newPrompt)
                        : undefined
                    }
                    onFollowUpClick={
                      isLastAssistantMessage && !message.isStreaming
                        ? handleFollowUpClick
                        : undefined
                    }
                    isLoadingFollowUps={loadingFollowUpsForMessage === message.id}
                  />
                </div>
              );
            })}

            {selectedCategory && (
              <div className="px-4 py-4">
                <div className="max-w-[680px] mx-auto space-y-3">
                  <p className="text-sm text-[#6b6560]">Suggested prompts:</p>
                  {loadingSuggestions ? (
                    <div className="grid grid-cols-1 gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="px-4 py-3 text-sm bg-white rounded-xl border border-[#ddd9d3] animate-pulse h-12"
                        />
                      ))}
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-4 py-3 text-left text-sm text-[#2b2622] bg-white hover:bg-[#e8e5e0] rounded-xl transition-colors border border-[#ddd9d3]"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {hasMessages && (
        <div className="px-3 md:px-4 py-6 bg-[#f5f3ef]">
          <div className="max-w-[680px] mx-auto space-y-3">
            <ChatInput
              onSend={handleSend}
              disabled={isStreaming}
              onCategorySelect={handleCategorySelect}
              onStop={stopGenerating}
              isGenerating={isStreaming}
            />
          </div>
        </div>
      )}
    </div>
  );
}
