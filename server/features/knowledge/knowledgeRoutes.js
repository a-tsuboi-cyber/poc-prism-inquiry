const express = require('express');
const router = express.Router();
const knowledgeService = require('./knowledgeService');

// ナレッジ一覧取得・検索
router.get('/', (req, res) => {
  const { q } = req.query;
  if (q) {
    return res.json(knowledgeService.search(q));
  }
  res.json(knowledgeService.getAll());
});

// ナレッジ新規作成
router.post('/', async (req, res) => {
  try {
    const { category, question, answer, tags } = req.body;
    if (!question || typeof question !== 'string' || !question.trim() || !answer || typeof answer !== 'string' || !answer.trim()) {
      return res.status(400).json({ error: 'question and answer are required' });
    }
    const created = await knowledgeService.create({
      category: category ? String(category).trim() : '一般',
      question: question.trim(),
      answer: answer.trim(),
      tags
    });
    res.status(201).json(created);
  } catch (err) {
    console.error('[KnowledgeRoutes] Create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ナレッジ更新
router.put('/:id', async (req, res) => {
  try {
    const updated = await knowledgeService.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Knowledge not found' });
    res.json(updated);
  } catch (err) {
    console.error('[KnowledgeRoutes] Update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ナレッジ削除
router.delete('/:id', (req, res) => {
  try {
    const success = knowledgeService.delete(req.params.id);
    if (!success) return res.status(404).json({ error: 'Knowledge not found' });
    res.json({ success: true, message: 'Knowledge deleted' });
  } catch (err) {
    console.error('[KnowledgeRoutes] Delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
