const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

let aiClient = null;
if (GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  } catch (err) {
    console.warn(`[GeminiService] Failed to initialize GoogleGenAI:`, err.message);
  }
}

// レスポンスからJSONを安全に抽出・パースするヘルパー
function extractJsonFromText(text) {
  if (!text) return null;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.warn('[GeminiService] JSON parse error:', err.message);
    return null;
  }
}

const geminiService = {
  isAvailable() {
    return Boolean(aiClient && GEMINI_API_KEY);
  },

  getModelName() {
    return GEMINI_MODEL;
  },

  /**
   * チャット対話の回答生成
   */
  async generateChatReply({ message, conversationHistory = [], knowledgeList = [], documentContext = '' }) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const historyContext = conversationHistory
        .slice(-6)
        .map(m => `${m.sender === 'user' ? 'ユーザー' : 'AI'}: ${m.text}`)
        .join('\n');

      const knowledgeContext = knowledgeList
        .slice(0, 15)
        .map(k => `【ナレッジID: ${k.id}】[${k.category}] Q: ${k.question} / A: ${k.answer} (タグ: ${(k.tags || []).join(', ')})`)
        .join('\n\n');

      const systemPrompt = `あなたはPRISM一次受けAIアシスタントです。
社内ユーザーからの問い合わせに対して、登録された【公式FAQナレッジ】および【登録手順書・マニュアル】に基づいて丁寧・正確かつ簡潔に日本語で回答してください。

【公式FAQナレッジ】
${knowledgeContext}

【登録手順書・マニュアル情報】
${documentContext || '（現在登録されているマニュアルはありません）'}

【回答の行動規範】
1. ナレッジやマニュアルに該当する内容がある場合は、その内容を分かりやすく要約・案内してください。
2. ナレッジを参考にした場合は、末尾に「（💡 参照ナレッジ: ナレッジID）」と明記してください。マニュアルを参照した場合は「（📄 参照ドキュメント: ドキュメント名）」と明記してください。
3. ナレッジやマニュアルに一切記載がない質問や推測できない問題、システム障害・アカウント個別調査が必要な場合は、適当な回答を捏造せず、正直にその旨を伝え「下の『エスカレーション』ボタンから運用チームへお問い合わせください」と誘導してください。
4. Markdown形式（箇条書き、太字、コード等）を適宜使って、読みやすく整形してください。`;

      const contents = [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n【これまでの対話履歴】\n${historyContext}\n\nユーザーの新しい質問: ${message}` }] }
      ];

      console.log(`[GeminiService] Calling ${GEMINI_MODEL} for chat reply...`);
      const response = await aiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: contents
      });

      const replyText = response.text ? response.text.trim() : '';

      const matchedId = replyText.match(/KNOW-\d+/);
      const linkedKnowledgeId = matchedId ? matchedId[0] : null;

      const isCandidate = replyText.includes('エスカレーション') || replyText.includes('見つかりませんでした') || replyText.includes('お答えできません');

      return {
        text: replyText,
        linkedKnowledgeId,
        isKnowledgeCandidate: isCandidate
      };
    } catch (err) {
      console.warn(`[GeminiService] Gemini API call failed (${err.message}). Falling back to rule-based mock.`);
      return null;
    }
  },

  /**
   * エスカレーションチケット用サマリー生成
   */
  async summarizeTicket({ messages = [], user = {} }) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const fullLog = messages.map(m => `[${m.sender === 'user' ? 'ユーザー' : 'AI'}]: ${m.text}`).join('\n');
      const prompt = `以下のPRISM問い合わせチャットログから、運用チームへのエスカレーションチケット用サマリーを生成してください。

【チャットログ】
${fullLog}

【重要指示】
・detail（詳細）は、第三者視点（例: 「ユーザーから〇〇と問い合わせあり」「〇〇について質問されている」等）は絶対に避け、問い合わせているユーザー本人になりきった一人称（例: 「〜で困っています」「〜の申請方法を教えていただきたいです」等、ユーザーが直接運用チームへ依頼する自然な口調）で記述してください。
・過度に長文にせず、発生状況や確認したいポイントが伝わる簡潔な文章（箇条書き可）にしてください。

【出力形式】
必ず以下のJSONフォーマットのみを出力してください。
{
  "subject": "30文字以内の簡潔な問い合わせ件名",
  "detail": "ユーザー本人になりきった困りごと・問い合わせ詳細",
  "category": "アカウント・権限 / システム不具合 / 操作方法 / 一般 のいずれか1つ",
  "urgency": "高 / 中 / 低 のいずれか1つ"
}`;

      console.log(`[GeminiService] Calling ${GEMINI_MODEL} for ticket summarization...`);
      const response = await aiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt
      });

      const text = response.text ? response.text.trim() : '';
      return extractJsonFromText(text);
    } catch (err) {
      console.warn(`[GeminiService] Summarization failed (${err.message}). Falling back.`);
      return null;
    }
  },

  /**
   * やり取りログからのナレッジ（QA）抽出
   */
  async extractKnowledgeQA({ messages = [] }) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const fullLog = messages.map(m => `[${m.sender === 'user' ? 'ユーザー' : 'AI'}]: ${m.text}`).join('\n');
      const prompt = `以下の問い合わせログから、他のユーザーにも役立つFAQナレッジの「標準化された質問」と「回答案」を作成してください。

【ログ】
${fullLog}

【出力形式】
以下のJSONフォーマットのみを出力してください。
{
  "suggestedQuestion": "ユーザーの質問を抽象化・一般化した分かりやすい質問文",
  "suggestedAnswer": "運用チームとして案内すべき模範回答案",
  "category": "アカウント・権限 / システム不具合 / 操作方法 / 一般 のいずれか",
  "tags": ["タグ1", "タグ2"]
}`;

      const response = await aiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt
      });

      const text = response.text ? response.text.trim() : '';
      return extractJsonFromText(text);
    } catch (err) {
      console.warn(`[GeminiService] QA extraction failed (${err.message}). Falling back.`);
      return null;
    }
  },

  /**
   * ナレッジ登録・更新時のAI改善ヒント生成
   */
  async generateKnowledgeHints({ question = '', answer = '', category = '' } = {}) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const prompt = `以下のFAQナレッジ（質問、回答、カテゴリ）をレビューし、ユーザーの自己解決率をさらに高めるための簡潔な改善アドバイスや追記すべきポイントを日本語で1〜2文（80文字以内程度）で提案してください。

【カテゴリ】${category || '一般'}
【質問】${question}
【回答】${answer}

改善アドバイスのみを簡潔に出力してください。`;

      const response = await aiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt
      });

      return response.text ? response.text.trim() : null;
    } catch (err) {
      console.warn(`[GeminiService] Knowledge hints generation failed (${err.message}).`);
      return null;
    }
  }
};

module.exports = geminiService;
