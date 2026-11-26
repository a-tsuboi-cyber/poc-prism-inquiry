export interface User {
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface Conversation {
  sessionId: string;
  user: { name: string; email: string };
  startedAt: string;
  topic: string;
  status: string;
  linkedKnowledgeId?: string | null;
  isKnowledgeCandidate?: boolean;
  messages: ChatMessage[];
}

export interface Ticket {
  id: string;
  sessionId?: string | null;
  subject: string;
  detail: string;
  category: string;
  urgency: '高' | '中' | '低' | string;
  phoneNumber?: string;
  linkedKnowledgeId?: string | null;
  user: { name: string; email: string };
  status: '新規' | '対応中' | '完了' | string;
  createdAt: string;
  updatedAt: string;
}

export interface Knowledge {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
  aiHints?: string;
  usageCount: number;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  type: 'knowledge' | 'manual';
  originalFileName: string;
  fileExtension: string;
  fileSize: number;
  storedFileName: string;
  uploadedBy: string;
  createdAt: string;
}

export interface SystemStatus {
  aiMode: string;
  model: string;
  isGeminiActive: boolean;
}
