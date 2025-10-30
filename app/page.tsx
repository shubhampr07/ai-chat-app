'use client';

import { ChatInterface } from '@/components/chat/ChatInterface';
import { Sidebar } from '@/components/layout/Sidebar';
import { CommandMenu } from '@/components/layout/CommandMenu';
import { UsernameDialog } from '@/components/layout/UsernameDialog';
import { useChat } from '@/hooks/useChat';
import { useState, useEffect } from 'react';

export default function Home() {
  const {
    sessions,
    activeSessionId,
    userId,
    username,
    isLoading,
    setActiveSessionId,
    addSession,
    deleteSession,
    updateSessionTitle,
    clearHistory,
    setupUser,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-expanded');
      return saved === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-expanded', String(sidebarOpen));
  }, [sidebarOpen]);

  // Show username dialog if no user is set
  const showUsernameDialog = !isLoading && !userId;

  return (
    <>
      <UsernameDialog open={showUsernameDialog} onSubmit={setupUser} />
      <CommandMenu onNewChat={addSession} onClearHistory={clearHistory} />
      <div className="flex h-screen bg-white overflow-hidden max-w-full">
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewSession={addSession}
          onDeleteSession={deleteSession}
          onRenameSession={updateSessionTitle}
          username={username}
          isOpen={sidebarOpen}
          onToggle={setSidebarOpen}
        />
        <ChatInterface key={activeSessionId} onOpenSidebar={() => setSidebarOpen(true)} />
      </div>
    </>
  );
}
