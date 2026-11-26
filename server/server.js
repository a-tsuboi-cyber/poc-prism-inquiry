require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const knowledgeService = require('./knowledgeService');
const conversationService = require('./conversationService');
const ticketService = require('./ticketService');
const documentService = require('./documentService');
const geminiService = require('./geminiService');
const teamsService = require('./teamsService');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer 一時アップロードディレクトリ
const upload = multer({ dest: path.join(__dirname, '../uploads/temp') });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// システム・AI設定ステータスAPI
app.get('/api/system/status', (req, res) => {
  res.json({
    aiMode: geminiService.isAvailable() ? 'gemini' : 'mock',
    model: geminiService.getModelName(),
    isGeminiActive: geminiService.isAvailable()
  });
});

// 1. チャット対話API
app.post('/api/chat', async (req, res) => {
  try {
    const { sessionId, user, message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    const result = await conversationService.handleUserMessage(sessionId, user, message);
    res.json(result);
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// セッションステータス更新（クローズ等）
app.post('/api/chat/status', (req, res) => {
  const { sessionId, status } = req.body;
  const result = conversationService.updateStatus(sessionId, status);
  res.json({ success: true, conversation: result });
});

// エスカレーション用サマリー取得
app.get('/api/chat/summary/:sessionId', async (req, res) => {
  try {
    const summary = await conversationService.summarizeForTicket(req.params.sessionId);
    res.json(summary);
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
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

  // Microsoft Teams への Adaptive Card 通知（非同期送信）
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  teamsService.sendTicketNotification(newTicket, baseUrl).catch(err => {
    console.error('[Server] Teams notification background error:', err.message);
  });

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

app.post('/api/knowledge', async (req, res) => {
  try {
    const { category, question, answer, tags } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'question and answer are required' });
    }
    const created = await knowledgeService.create({ category, question, answer, tags });
    res.status(201).json(created);
  } catch (err) {
    console.error('Knowledge create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/knowledge/:id', async (req, res) => {
  try {
    const updated = await knowledgeService.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Knowledge not found' });
    res.json(updated);
  } catch (err) {
    console.error('Knowledge update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. ドキュメント管理API (新機能)
app.get('/api/documents', (req, res) => {
  const { type, sortKey, sortOrder } = req.query;
  const docs = documentService.getAll({ type, sortKey, sortOrder });
  res.json(docs);
});

app.post('/api/documents', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'file is required' });
    }
    let user = null;
    if (req.body.user) {
      try { user = JSON.parse(req.body.user); } catch (e) {}
    }
    const doc = documentService.create({
      file: req.file,
      title: req.body.title,
      type: req.body.type,
      user
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error('Document upload error:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

app.delete('/api/documents/:id', (req, res) => {
  const success = documentService.delete(req.params.id);
  if (!success) return res.status(404).json({ error: 'Document not found' });
  res.json({ success: true, message: 'Document deleted' });
});

app.get('/api/documents/:id/download', (req, res) => {
  const fileInfo = documentService.getFilePath(req.params.id);
  if (!fileInfo) return res.status(404).json({ error: 'File not found' });
  res.download(fileInfo.path, fileInfo.originalName);
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`[PRISM Inquiry Server] Running at http://localhost:${PORT}`);
  console.log(`[PRISM AI Model] Target: ${geminiService.getModelName()}`);
  console.log(`[PRISM AI Status] ${geminiService.isAvailable() ? 'ONLINE (Gemini API Active)' : 'OFFLINE (Fallback Mock Active)'}`);
  console.log(`=======================================================`);
});
