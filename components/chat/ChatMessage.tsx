'use client';

import { Message } from '@/types/chat';
import { ArtifactBlock } from './ArtifactBlock';
import { MarkdownContent } from './MarkdownContent';
import { FollowUpQuestions } from './FollowUpQuestions';
import { Copy, RotateCw, Pencil } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
  onEdit?: (newPrompt: string) => void;
  onCopy?: () => void;
  onFollowUpClick?: (question: string) => void;
  isLoadingFollowUps?: boolean;
}

export function ChatMessage({ message, onRegenerate, onEdit, onCopy, onFollowUpClick, isLoadingFollowUps }: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  const handleEdit = () => {
    if (isEditing && editValue !== message.content) {
      onEdit?.(editValue);
    }
    setIsEditing(!isEditing);
  };

  if (message.role === 'user') {
    return (
      <div className="group relative py-4 px-3 md:px-6 w-full box-border">
        <div className="max-w-[48rem] mx-auto bg-white rounded-xl p-3 md:p-4 shadow-sm">
          <div className="flex gap-3 md:gap-4 items-start w-full">
            <div className="w-8 h-8 rounded-full bg-[#2b2622] text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
              S
            </div>
            <div className="flex-1 pt-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full p-3 border border-[#ddd9d3] rounded-lg resize-none min-h-[100px] focus:outline-none focus:border-[#cc785c] transition-colors text-[15px] text-[#2b2622]"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-[#2b2622] text-white text-sm rounded-md hover:bg-[#1a1612] transition-colors"
                    >
                      Submit
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-white text-[#2b2622] border border-[#ddd9d3] text-sm rounded-md hover:bg-[#f5f3ef] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative pr-10">
                  <p className="text-[15px] leading-7 text-[#2b2622] whitespace-pre-wrap break-words">{message.content}</p>
                  {onEdit && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-[#e8e5e0] rounded"
                    >
                      <Pencil className="h-4 w-4 text-[#6b6560]" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative py-4 px-3 md:px-6 w-full box-border">
      <div className="max-w-[48rem] mx-auto">
        <div className="flex gap-3 md:gap-6 w-full">
          <div className="flex-1 min-w-0">
            {message.isStreaming ? (
              <div className="space-y-3">
                {/* Parse markdown during streaming too for consistent display */}
                <div className="prose prose-sm max-w-none overflow-hidden">
                  <MarkdownContent content={message.content} />
                </div>
                {!message.content && (
                  <div className="flex items-center gap-2 text-sm text-[#6b6560]">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#cc785c] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#cc785c] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#cc785c] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none overflow-hidden">
                  <MarkdownContent content={message.content} />
                </div>

                {message.artifacts && message.artifacts.map((artifact) => (
                  <ArtifactBlock key={artifact.id} artifact={artifact} />
                ))}

                <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#6b6560] hover:bg-white rounded transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  {onRegenerate && (
                    <button
                      onClick={onRegenerate}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#6b6560] hover:bg-white rounded transition-colors"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      Retry
                    </button>
                  )}
                </div>

                {onFollowUpClick && (
                  <FollowUpQuestions
                    questions={message.followUpQuestions || []}
                    onQuestionClick={onFollowUpClick}
                    isLoading={isLoadingFollowUps}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
