const fs = require('fs');
const path = require('path');

const TICKETS_FILE = path.join(__dirname, '../../../data/tickets.json');

function readTickets() {
  if (!fs.existsSync(TICKETS_FILE)) return [];
  const raw = fs.readFileSync(TICKETS_FILE, 'utf-8');
  return JSON.parse(raw || '[]');
}

function writeTickets(data) {
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

const ticketService = {
  getAll({ status, urgency, category, sortKey = 'createdAt', sortOrder = 'desc' } = {}) {
    let list = readTickets();

    // 絞り込みフィルター
    if (status && status !== 'all') {
      list = list.filter(t => t.status === status);
    }
    if (urgency && urgency !== 'all') {
      list = list.filter(t => t.urgency === urgency);
    }
    if (category && category !== 'all') {
      list = list.filter(t => t.category === category);
    }

    // ソート処理
    list.sort((a, b) => {
      let valA = a[sortKey] || '';
      let valB = b[sortKey] || '';

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  },

  getById(id) {
    const list = readTickets();
    return list.find(t => t.id === id) || null;
  },

  create({ sessionId, subject, detail, category, urgency, phoneNumber, linkedKnowledgeId, user }) {
    const list = readTickets();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const nextNum = list.length + 1;
    const newId = `TICK-${dateStr}-${String(nextNum).padStart(3, '0')}`;

    const newTicket = {
      id: newId,
      sessionId: sessionId || null,
      subject: subject || "PRISM問い合わせ",
      detail: detail || "",
      category: category || "一般",
      urgency: urgency || "中",
      phoneNumber: phoneNumber || "",
      linkedKnowledgeId: linkedKnowledgeId || null,
      user: user || { name: "ゲスト", email: "guest@example.com" },
      status: "新規",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    list.unshift(newTicket);
    writeTickets(list);
    return newTicket;
  },

  updateStatus(id, newStatus) {
    const list = readTickets();
    const ticket = list.find(t => t.id === id);
    if (!ticket) return null;

    ticket.status = newStatus;
    ticket.updatedAt = new Date().toISOString();
    writeTickets(list);
    return ticket;
  }
};

module.exports = ticketService;
