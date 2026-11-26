const API_BASE = '/api';
function toQueryParams(params) {
    if (!params)
        return '';
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
    async getSystemStatus() {
        const res = await fetch(`${API_BASE}/system/status`);
        return res.json();
    },
    // チャット
    async sendMessage(params) {
        const res = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });
        return res.json();
    },
    async updateChatStatus(sessionId, status) {
        const res = await fetch(`${API_BASE}/chat/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, status }),
        });
        return res.json();
    },
    async getChatSummary(sessionId) {
        const res = await fetch(`${API_BASE}/chat/summary/${sessionId}`);
        return res.json();
    },
    async getConversations() {
        const res = await fetch(`${API_BASE}/conversations`);
        return res.json();
    },
    async getConversationById(sessionId) {
        const res = await fetch(`${API_BASE}/conversations/${sessionId}`);
        return res.json();
    },
    // チケット
    async getTickets(params) {
        const res = await fetch(`${API_BASE}/tickets${toQueryParams(params)}`);
        return res.json();
    },
    async getTicketDetail(id) {
        const res = await fetch(`${API_BASE}/tickets/${id}`);
        return res.json();
    },
    async createTicket(ticketData) {
        const res = await fetch(`${API_BASE}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData),
        });
        return res.json();
    },
    async updateTicketStatus(id, status) {
        const res = await fetch(`${API_BASE}/tickets/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        return res.json();
    },
    // ナレッジ
    async getKnowledge(query) {
        const url = query ? `${API_BASE}/knowledge?q=${encodeURIComponent(query)}` : `${API_BASE}/knowledge`;
        const res = await fetch(url);
        return res.json();
    },
    async createKnowledge(data) {
        const res = await fetch(`${API_BASE}/knowledge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    async updateKnowledge(id, data) {
        const res = await fetch(`${API_BASE}/knowledge/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    async deleteKnowledge(id) {
        const res = await fetch(`${API_BASE}/knowledge/${id}`, {
            method: 'DELETE',
        });
        return res.json();
    },
    // ドキュメント
    async getDocuments(params) {
        const res = await fetch(`${API_BASE}/documents${toQueryParams(params)}`);
        return res.json();
    },
    async uploadDocument(formData) {
        const res = await fetch(`${API_BASE}/documents`, {
            method: 'POST',
            body: formData,
        });
        return res.json();
    },
    async updateDocument(id, data) {
        const res = await fetch(`${API_BASE}/documents/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    async deleteDocument(id) {
        const res = await fetch(`${API_BASE}/documents/${id}`, {
            method: 'DELETE',
        });
        return res.json();
    },
    getDocumentDownloadUrl(id) {
        return `${API_BASE}/documents/${id}/download`;
    }
};
