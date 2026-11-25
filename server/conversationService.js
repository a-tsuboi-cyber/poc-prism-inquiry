const fs = require('fs');
const path = require('path');
const knowledgeService = require('./knowledgeService');
const geminiService = require('./geminiService');

const CONVERSATIONS_FILE = path.join(__dirname, '../data/conversations.json');

function readConversations() {
  if (!fs.existsSync(CONVERSATIONS_FILE)) return [];
  const raw = fs.readFileSync(CONVERSATIONS_FILE, 'utf-8');
  return JSON.parse(raw || '[]');
}

function writeConversations(data) {
  fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

const conversationService = {
  getAll() {
    return readConversations();
  },

  getById(sessionId) {
    const list = readConversations();
    return list.find(c => c.sessionId === sessionId) || null;
  },

  // ユーザーの発話に対して回答を生成し、セッションに記録
  async handleUserMessage(sessionId, user, messageText) {
    let list = readConversations();
    let conv = list.find(c => c.sessionId === sessionId);

    if (!conv) {
      conv = {
        sessionId: sessionId || `SES-${Date.now()}`,
        user: user || { name: 'ゲスト', email: 'guest@example.com' },
        startedAt: new Date().toISOString(),
        topic: messageText.slice(0, 30),
        status: '進行中',
        linkedKnowledgeId: null,
        isKnowledgeCandidate: false,
        messages: []
      };
      list.unshift(conv);
    }

    const timestamp = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    conv.messages.push({
      sender: 'user',
      text: messageText,
      timestamp
    });

    // 1. Gemini APIによる回答生成を試行
    const allKnowledge = knowledgeService.getAll();
    let geminiResult = null;
    if (geminiService.isAvailable()) {
      geminiResult = await geminiService.generateChatReply({
        message: messageText,
        conversationHistory: conv.messages,
        knowledgeList: allKnowledge
      });
    }

    let aiResponseText = "";
    if (geminiResult && geminiResult.text) {
      aiResponseText = geminiResult.text;
      conv.linkedKnowledgeId = geminiResult.linkedKnowledgeId || conv.linkedKnowledgeId;
      conv.isKnowledgeCandidate = Boolean(geminiResult.isKnowledgeCandidate);
      if (conv.linkedKnowledgeId) {
        knowledgeService.incrementUsage(conv.linkedKnowledgeId);
      }
    } else {
      // 2. フォールバック: ルールベースのナレッジ検索で回答生成
      const matched = knowledgeService.search(messageText);
      if (matched.length > 0) {
        const matchedKnowledge = matched[0];
        conv.linkedKnowledgeId = matchedKnowledge.id;
        knowledgeService.incrementUsage(matchedKnowledge.id);
        aiResponseText = `${matchedKnowledge.answer}\n\n（💡 参照ナレッジ: ${matchedKnowledge.id} - ${matchedKnowledge.category}）\nもし解決しない場合は、下の「エスカレーション」ボタンから運用チームへお知らせください。`;
      } else {
        conv.isKnowledgeCandidate = true;
        aiResponseText = `申し訳ありません。ご質問の件について該当するマニュアル・ナレッジが見つかりませんでした。\n\n詳細を伺い運用チームで調査いたしますので、下の「エスカレーション」ボタンよりお問い合わせをお願いいたします。`;
      }
    }

    conv.messages.push({
      sender: 'ai',
      text: aiResponseText,
      timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    writeConversations(list);
    return {
      sessionId: conv.sessionId,
      aiMessage: aiResponseText,
      linkedKnowledgeId: conv.linkedKnowledgeId
    };
  },

  // クローズまたはエスカレーションへのステータス変更
  updateStatus(sessionId, status) {
    const list = readConversations();
    const conv = list.find(c => c.sessionId === sessionId);
    if (conv) {
      conv.status = status;
      writeConversations(list);
    }
    return conv;
  },

  // エスカレーション用/ナレッジ登録用のAI要約サマリー生成
  async summarizeForTicket(sessionId) {
    const conv = this.getById(sessionId);
    if (!conv || conv.messages.length === 0) {
      return {
        subject: "PRISMシステム問い合わせ",
        detail: "やり取り詳細をご確認ください。",
        suggestedQuestion: "",
        suggestedAnswer: "",
        category: "一般",
        urgency: "中"
      };
    }

    const userMsgs = conv.messages.filter(m => m.sender === 'user').map(m => m.text);
    const firstMsg = userMsgs[0] || "システム問い合わせ";

    // 1. Gemini による要約とQA抽出を試行
    let geminiSummary = null;
    let geminiQA = null;
    if (geminiService.isAvailable()) {
      [geminiSummary, geminiQA] = await Promise.all([
        geminiService.summarizeTicket({ messages: conv.messages, user: conv.user }),
        geminiService.extractKnowledgeQA({ messages: conv.messages })
      ]);
    }

    // デフォルト・ルールベース値の算出
    const fullLog = conv.messages.map(m => `[${m.sender === 'user' ? 'ユーザー' : 'AI'}]: ${m.text}`).join('\n');
    let fallbackCategory = "一般";
    let fallbackUrgency = "中";
    if (fullLog.includes("アカウント") || fullLog.includes("権限") || fullLog.includes("申請")) {
      fallbackCategory = "アカウント・権限";
    } else if (fullLog.includes("エラー") || fullLog.includes("動かない") || fullLog.includes("障害") || fullLog.includes("504")) {
      fallbackCategory = "システム不具合";
      fallbackUrgency = "高";
    } else if (fullLog.includes("手順") || fullLog.includes("エクスポート") || fullLog.includes("方法")) {
      fallbackCategory = "操作方法";
    }

    return {
      subject: geminiSummary?.subject || `【問い合わせ】${firstMsg.slice(0, 35)}`,
      detail: geminiSummary?.detail || userMsgs.join('\n'),
      suggestedQuestion: geminiQA?.suggestedQuestion || firstMsg,
      suggestedAnswer: geminiQA?.suggestedAnswer || "【回答案】運用チームによる確認の上、以下の手順でご案内します：\n・対象設定の確認\n・対応完了後の通知",
      category: geminiSummary?.category || fallbackCategory,
      urgency: geminiSummary?.urgency || fallbackUrgency,
      tags: geminiQA?.tags || [fallbackCategory],
      linkedKnowledgeId: conv.linkedKnowledgeId,
      fullLog: conv.messages
    };
  }
};

module.exports = conversationService;
