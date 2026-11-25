const fs = require('fs');
const path = require('path');

const KNOWLEDGE_FILE = path.join(__dirname, '../data/knowledge.json');

function readKnowledge() {
  if (!fs.existsSync(KNOWLEDGE_FILE)) return [];
  const raw = fs.readFileSync(KNOWLEDGE_FILE, 'utf-8');
  return JSON.parse(raw || '[]');
}

function writeKnowledge(data) {
  fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

const knowledgeService = {
  getAll() {
    return readKnowledge();
  },

  getById(id) {
    const list = readKnowledge();
    return list.find(k => k.id === id) || null;
  },

  search(query) {
    const list = readKnowledge();
    if (!query) return list;
    const q = query.toLowerCase();
    
    // スコアリングマッチング
    const matched = list.map(item => {
      let score = 0;
      if (item.question.toLowerCase().includes(q)) score += 5;
      if (item.answer.toLowerCase().includes(q)) score += 3;
      if (item.tags.some(t => q.includes(t.toLowerCase()) || t.toLowerCase().includes(q))) score += 4;
      if (item.category.toLowerCase().includes(q)) score += 2;
      return { item, score };
    }).filter(m => m.score > 0).sort((a, b) => b.score - a.score);

    return matched.map(m => m.item);
  },

  create({ category, question, answer, tags }) {
    const list = readKnowledge();
    const nextNum = list.length + 1;
    const newId = `KN-${String(nextNum).padStart(3, '0')}`;
    
    // 自動生成ヒント（簡易ルール）
    let hint = "補足リンクや連絡先を回答に含めると、より自己解決率が向上します。";
    if (category === "アカウント・権限") {
      hint = "申請フォームのURLや、発行までの所要目安（通常○営業日）を追記すると手戻りを防げます。";
    } else if (category === "システム不具合") {
      hint = "エラー画面のスクリーンショット取得依頼や、推奨ブラウザ環境を追記することをおすすめします。";
    }

    const newKnowledge = {
      id: newId,
      category: category || "一般",
      question,
      answer,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      aiHints: hint,
      usageCount: 0,
      updatedAt: new Date().toISOString()
    };

    list.unshift(newKnowledge);
    writeKnowledge(list);
    return newKnowledge;
  },

  update(id, { question, answer, category, tags }) {
    const list = readKnowledge();
    const idx = list.findIndex(k => k.id === id);
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      question: question !== undefined ? question : list[idx].question,
      answer: answer !== undefined ? answer : list[idx].answer,
      category: category !== undefined ? category : list[idx].category,
      tags: tags !== undefined ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : list[idx].tags,
      updatedAt: new Date().toISOString()
    };

    writeKnowledge(list);
    return list[idx];
  },

  incrementUsage(id) {
    const list = readKnowledge();
    const item = list.find(k => k.id === id);
    if (item) {
      item.usageCount = (item.usageCount || 0) + 1;
      writeKnowledge(list);
    }
  }
};

module.exports = knowledgeService;
