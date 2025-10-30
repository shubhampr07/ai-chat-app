export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  artifacts?: Artifact[];
  isStreaming?: boolean;
  followUpQuestions?: string[];
}

export interface Artifact {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  language?: string;
  expanded?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface SearchResult {
  id: string;
  text: string;
  type: 'person' | 'general';
  metadata?: Record<string, unknown>;
}
