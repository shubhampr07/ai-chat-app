'use client';

import { ChatSession } from '@/types/chat';
import { Menu, Plus, Search, HelpCircle, Code, Sparkles, MessageSquare, Trash2, X, Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession?: (id: string, newTitle: string) => void;
  username?: string;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  username = '',
  isOpen,
  onToggle,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const truncateTitle = (title: string, maxLength: number = 20) => {
    if (title.length <= maxLength) return title;
    return title.slice(0, maxLength).trim() + '...';
  };

  const handleRenameStart = (session: ChatSession) => {
    setEditingId(session.id);
    setEditValue(session.title);
  };

  const handleRenameSubmit = (sessionId: string) => {
    if (editValue.trim() && onRenameSession) {
      onRenameSession(sessionId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleRenameCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  if (!mounted) {
    // Return a default state for SSR to prevent hydration mismatch
    return (
      <>
        {/* Sidebar - Collapsed state (default for SSR) */}
        <div className="w-12 bg-[#f5f3ef] border-r border-[#e8e5e0] hidden md:flex flex-col items-center py-3 gap-2">
          <button
            className="w-8 h-8 flex items-center justify-center hover:bg-white/50 rounded-lg transition-colors"
            title="Menu"
          >
            <Menu className="h-5 w-5 text-[#6b6560]" />
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center bg-[#cc785c] hover:bg-[#b86a4f] rounded-lg transition-colors"
            title="New chat"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
          <div className="flex-1" />
          <button
            className="w-8 h-8 flex items-center justify-center bg-[#2b2622] text-white rounded-full mb-1"
            title="Account"
          >
            <span className="text-xs font-medium">{username.charAt(0).toUpperCase() || 'U'}</span>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => onToggle(false)}
      />

      {/* Sidebar - Expanded state */}
      <div
        className={`fixed md:relative inset-y-0 left-0 w-64 bg-[#f5f3ef] border-r border-[#e8e5e0] flex-col h-full z-50 transition-transform duration-300 ease-in-out ${
          isOpen
            ? 'flex translate-x-0'
            : 'hidden md:hidden -translate-x-full'
        }`}
      >
        <div className="p-3 flex items-center justify-between">
            <button
              onClick={() => onToggle(false)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              title="Collapse sidebar"
            >
              <X className="h-5 w-5 text-[#6b6560]" />
            </button>
            <button
              onClick={onNewSession}
              className="p-2 bg-[#cc785c] hover:bg-[#b86a4f] rounded-lg transition-colors"
              title="New chat"
            >
              <Plus className="h-5 w-5 text-white" />
            </button>
          </div>

        <ScrollArea className="flex-1">
          <div className="pl-2 pr-4 py-2 pb-4">
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative rounded-lg transition-all ${
                    session.id === activeSessionId
                      ? 'bg-white shadow-sm'
                      : 'hover:bg-white/50'
                  }`}
                >
                  {editingId === session.id ? (
                    <div className="px-3 py-2.5 flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameSubmit(session.id);
                          } else if (e.key === 'Escape') {
                            handleRenameCancel();
                          }
                        }}
                        className="flex-1 px-2 py-1 text-[13px] text-[#2b2622] font-medium bg-white border border-[#ddd9d3] rounded focus:outline-none focus:border-[#cc785c]"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRenameSubmit(session.id)}
                        className="p-1 hover:bg-[#e8e5e0] rounded"
                        title="Save"
                      >
                        <svg className="h-4 w-4 text-[#6b6560]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleRenameCancel}
                        className="p-1 hover:bg-[#e8e5e0] rounded"
                        title="Cancel"
                      >
                        <X className="h-4 w-4 text-[#6b6560]" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onSelectSession(session.id)}
                        className="w-full px-3 py-2.5 pr-16 text-left text-[13px] flex items-center gap-2 rounded-lg"
                        title={session.title}
                      >
                        <MessageSquare className="h-4 w-4 flex-shrink-0 text-[#6b6560]" />
                        <span className="flex-1 text-[#2b2622] font-medium overflow-hidden text-ellipsis whitespace-nowrap">
                          {truncateTitle(session.title)}
                        </span>
                      </button>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameStart(session);
                          }}
                          className="p-1.5 hover:bg-[#e8e5e0] rounded-md"
                          title="Rename chat"
                        >
                          <Pencil className="h-3.5 w-3.5 text-[#6b6560]" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="p-1.5 hover:bg-[#e8e5e0] rounded-md"
                          title="Delete chat"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-[#6b6560]" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-[#e8e5e0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2b2622] text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
              {username.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="text-sm text-[#2b2622] font-medium truncate">{username || 'User'}</span>
          </div>
        </div>
      </div>

      {/* Sidebar - Collapsed state (desktop only) */}
      <div
        className={`w-12 bg-[#f5f3ef] border-r border-[#e8e5e0] flex-col items-center py-3 gap-2 ${
          isOpen ? 'hidden md:hidden' : 'hidden md:flex'
        }`}
      >
        <button
          onClick={() => onToggle(true)}
          className="w-8 h-8 flex items-center justify-center hover:bg-white/50 rounded-lg transition-colors"
          title="Menu"
        >
          <Menu className="h-5 w-5 text-[#6b6560]" />
        </button>

        <button
          onClick={onNewSession}
          className="w-8 h-8 flex items-center justify-center bg-[#cc785c] hover:bg-[#b86a4f] rounded-lg transition-colors"
          title="New chat"
        >
          <Plus className="h-5 w-5 text-white" />
        </button>

        <div className="flex-1" />

        <button
          className="w-8 h-8 flex items-center justify-center bg-[#2b2622] text-white rounded-full mb-1"
          title="Account"
        >
          <span className="text-xs font-medium">{username.charAt(0).toUpperCase() || 'U'}</span>
        </button>
      </div>
    </>
  );
}
