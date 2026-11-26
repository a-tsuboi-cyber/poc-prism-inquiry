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
    if (!question || !answer) {
      return res.status(400).json({ error: 'question and answer are required' });
    }
    const created = await knowledgeService.create({ category, question, answer, tags });
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

module.exports = router;
