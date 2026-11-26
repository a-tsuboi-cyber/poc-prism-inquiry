import { Ticket, Knowledge, DocumentItem, Conversation, SystemStatus, User } from '@/types';

const API_BASE = '/api';

function toQueryParams(params?: Record<string, string | undefined>): string {
  if (!params) return '';
  const query = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== '') {
      query.append(key, val);
    }
  }
  const str = query.toString();
  return str ? `?${str}` : '';
}

export const api = {
  // システムステータス
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch(`${API_BASE}/system/status`);
    return res.json();
  },

  // チャット
  async sendMessage(params: {
    sessionId: string;
    user: { name: string; email: string };
    message: string;
  }): Promise<{ sessionId: string; aiMessage: string; linkedKnowledgeId?: string }> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async updateChatStatus(sessionId: string, status: string): Promise<any> {
    const res = await fetch(`${API_BASE}/chat/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, status }),
    });
    return res.json();
  },

  async getChatSummary(sessionId: string): Promise<{
    subject: string;
    detail: string;
    suggestedQuestion: string;
    suggestedAnswer: string;
    category: string;
    urgency: string;
    tags?: string[];
    linkedKnowledgeId?: string | null;
  }> {
    const res = await fetch(`${API_BASE}/chat/summary/${sessionId}`);
    return res.json();
  },

  async getConversations(): Promise<Conversation[]> {
    const res = await fetch(`${API_BASE}/conversations`);
    return res.json();
  },

  async getConversationById(sessionId: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations/${sessionId}`);
    return res.json();
  },

  // チケット
  async getTickets(params?: {
    status?: string;
    urgency?: string;
    category?: string;
    sortKey?: string;
    sortOrder?: string;
  }): Promise<Ticket[]> {
    const res = await fetch(`${API_BASE}/tickets${toQueryParams(params)}`);
    return res.json();
  },

  async getTicketDetail(id: string): Promise<{ ticket: Ticket; conversation?: Conversation }> {
    const res = await fetch(`${API_BASE}/tickets/${id}`);
    return res.json();
  },

  async createTicket(ticketData: {
    sessionId?: string;
    subject: string;
    detail: string;
    category: string;
    urgency: string;
    phoneNumber?: string;
    linkedKnowledgeId?: string | null;
    user: { name: string; email: string };
  }): Promise<Ticket> {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData),
    });
    return res.json();
  },

  async updateTicketStatus(id: string, status: string): Promise<Ticket> {
    const res = await fetch(`${API_BASE}/tickets/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // ナレッジ
  async getKnowledge(query?: string): Promise<Knowledge[]> {
    const url = query ? `${API_BASE}/knowledge?q=${encodeURIComponent(query)}` : `${API_BASE}/knowledge`;
    const res = await fetch(url);
    return res.json();
  },

  async createKnowledge(data: {
    category: string;
    question: string;
    answer: string;
    tags: string[];
  }): Promise<Knowledge> {
    const res = await fetch(`${API_BASE}/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateKnowledge(id: string, data: Partial<Knowledge>): Promise<Knowledge> {
    const res = await fetch(`${API_BASE}/knowledge/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteKnowledge(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/knowledge/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // ドキュメント
  async getDocuments(params?: { type?: string; sortKey?: string; sortOrder?: string }): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE}/documents${toQueryParams(params)}`);
    return res.json();
  },

  async uploadDocument(formData: FormData): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  async updateDocument(id: string, data: { title?: string; type?: 'knowledge' | 'manual' }): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  getDocumentDownloadUrl(id: string): string {
    return `${API_BASE}/documents/${id}/download`;
  }
};
