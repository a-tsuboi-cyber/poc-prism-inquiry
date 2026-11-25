const express = require('express');
const cors = require('cors');
const path = require('path');

const knowledgeService = require('./knowledgeService');
const conversationService = require('./conversationService');
const ticketService = require('./ticketService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 1. チャット対話API
app.post('/api/chat', (req, res) => {
  const { sessionId, user, message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }
  const result = conversationService.handleUserMessage(sessionId, user, message);
  res.json(result);
});

// セッションステータス更新（クローズ等）
app.post('/api/chat/status', (req, res) => {
  const { sessionId, status } = req.body;
  const result = conversationService.updateStatus(sessionId, status);
  res.json({ success: true, conversation: result });
});

// エスカレーション用サマリー取得
app.get('/api/chat/summary/:sessionId', (req, res) => {
  const summary = conversationService.summarizeForTicket(req.params.sessionId);
  res.json(summary);
});

// 2. やり取りログ一覧 & 詳細API
app.get('/api/conversations', (req, res) => {
  const list = conversationService.getAll();
  res.json(list);
});

app.get('/api/conversations/:sessionId', (req, res) => {
  const conv = conversationService.getById(req.params.sessionId);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  res.json(conv);
});

// 3. チケット管理API
app.get('/api/tickets', (req, res) => {
  const { status, urgency, category, sortKey, sortOrder } = req.query;
  const tickets = ticketService.getAll({ status, urgency, category, sortKey, sortOrder });
  res.json(tickets);
});

app.get('/api/tickets/:id', (req, res) => {
  const ticket = ticketService.getById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  
  // 紐づく実際の会話ログも添えて返す
  let conversation = null;
  if (ticket.sessionId) {
    conversation = conversationService.getById(ticket.sessionId);
  }
  res.json({ ticket, conversation });
});

app.post('/api/tickets', (req, res) => {
  const newTicket = ticketService.create(req.body);
  if (req.body.sessionId) {
    conversationService.updateStatus(req.body.sessionId, 'エスカレーション');
  }
  res.status(201).json(newTicket);
});

app.patch('/api/tickets/:id/status', (req, res) => {
  const { status } = req.body;
  const updated = ticketService.updateStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Ticket not found' });
  res.json(updated);
});

// 4. ナレッジ管理API
app.get('/api/knowledge', (req, res) => {
  const { q } = req.query;
  if (q) {
    return res.json(knowledgeService.search(q));
  }
  res.json(knowledgeService.getAll());
});

app.post('/api/knowledge', (req, res) => {
  const { category, question, answer, tags } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: 'question and answer are required' });
  }
  const created = knowledgeService.create({ category, question, answer, tags });
  res.status(201).json(created);
});

app.put('/api/knowledge/:id', (req, res) => {
  const updated = knowledgeService.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Knowledge not found' });
  res.json(updated);
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`[PRISM Inquiry Server] Running at http://localhost:${PORT}`);
});
