const express = require('express');
const router = express.Router();
const ticketService = require('./ticketService');
const chatService = require('../chat/chatService');
const teamsService = require('../../integrations/teams/teamsService');

// チケット一覧取得
router.get('/', (req, res) => {
  const { status, urgency, category, sortKey, sortOrder } = req.query;
  const tickets = ticketService.getAll({ status, urgency, category, sortKey, sortOrder });
  res.json(tickets);
});

// チケット詳細取得（関連会話ログ含む）
router.get('/:id', (req, res) => {
  const ticket = ticketService.getById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  
  let conversation = null;
  if (ticket.sessionId) {
    conversation = chatService.getById(ticket.sessionId);
  }
  res.json({ ticket, conversation });
});

// チケット新規作成（エスカレーション時）
router.post('/', (req, res) => {
  const newTicket = ticketService.create(req.body);
  if (req.body.sessionId) {
    chatService.updateStatus(req.body.sessionId, 'エスカレーション');
  }

  // Microsoft Teams への Adaptive Card 通知（非同期送信）
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  teamsService.sendTicketNotification(newTicket, baseUrl).catch(err => {
    console.error('[TicketRoutes] Teams notification background error:', err.message);
  });

  res.status(201).json(newTicket);
});

// チケットステータス更新
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const updated = ticketService.updateStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Ticket not found' });
  res.json(updated);
});

module.exports = router;
