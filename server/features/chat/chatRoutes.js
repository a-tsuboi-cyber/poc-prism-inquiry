const express = require('express');
const router = express.Router();
const chatService = require('./chatService');

// チャット発話・回答生成API
router.post('/chat', async (req, res) => {
  try {
    const { sessionId, user, message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    const result = await chatService.handleUserMessage(sessionId, user, message);
    res.json(result);
  } catch (err) {
    console.error('[ChatRoutes] Chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// セッションステータス更新（クローズ等）
router.post('/chat/status', (req, res) => {
  const { sessionId, status } = req.body;
  const result = chatService.updateStatus(sessionId, status);
  res.json({ success: true, conversation: result });
});

// エスカレーション用サマリー取得
router.get('/chat/summary/:sessionId', async (req, res) => {
  try {
    const summary = await chatService.summarizeForTicket(req.params.sessionId);
    res.json(summary);
  } catch (err) {
    console.error('[ChatRoutes] Summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// やり取りログ一覧取得
router.get('/conversations', (req, res) => {
  const list = chatService.getAll();
  res.json(list);
});

// やり取りログ詳細取得
router.get('/conversations/:sessionId', (req, res) => {
  const conv = chatService.getById(req.params.sessionId);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  res.json(conv);
});

module.exports = router;
