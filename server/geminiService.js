const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

let aiClient = null;
if (GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  } catch (err) {
    console.error('[GeminiService] Failed to initialize GoogleGenAI client:', err.message);
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
   * ナレッジ一覧、登録ドキュメント、および対話ログをコンテキストに含めてGeminiに問い合わせる
   */
  async generateChatReply({ message, conversationHistory = [], knowledgeList = [], documentContext = '' }) {
    if (!this.isAvailable()) {
      return null; // フォールバックトリガー
    }

    try {
      const knowledgeContext = knowledgeList.map(k => 
        `[ナレッジID: ${k.id}] カテゴリ: ${k.category}\n質問: ${k.question}\n回答: ${k.answer}\nタグ: ${k.tags.join(', ')}`
      ).join('\n---\n');

      const historyContext = conversationHistory.slice(-6).map(m => 
        `${m.sender === 'user' ? 'ユーザー' : 'AI'}: ${m.text}`
      ).join('\n');

      const prompt = `あなたは日本テレビ及びパートナー企業（Wands, VAP, AX-ON等）向けの社内業務システム「PRISM」の一次受けAIアシスタントです。
以下の登録ナレッジおよび登録ドキュメント（業務マニュアル・手順書等）を参照し、ユーザーの質問に対して丁寧・簡潔・正確に回答してください。

【登録ナレッジ一覧】
${knowledgeContext || '（登録ナレッジなし）'}

【登録ドキュメント（マニュアル・手順書・規定等）】
${documentContext || '（登録ドキュメントなし）'}

【直近の会話履歴】
${historyContext || '（新規対話）'}

【ユーザーの最新メッセージ】
${message}

【回答ルール】
1. ナレッジまたは登録ドキュメントに該当する情報がある場合は、その内容を分かりやすく要約・引用して自然な言葉で案内してください。
   - ナレッジを参照した場合は文末に「（💡 参照ナレッジ: [ナレッジID]）」と記載してください。
   - ドキュメントを参照した場合は文末に「（📄 参照ドキュメント: [ドキュメント名]）」と記載してください。
2. ナレッジやドキュメントにない内容や解決できない専門的な内容の場合は、知ったかぶりをせず「該当するマニュアルが見つかりませんでした」と率直に伝え、「画面下の『エスカレーション』ボタンから運用チームへお問い合わせください」と案内してください。
3. 文末に、解決しない場合はエスカレーションできる旨を添えてください。
4. JSONではなく、ユーザーにそのまま届ける通常のメッセージ文のみを出力してください。`;

      console.log(`[GeminiService] Calling ${GEMINI_MODEL} for chat reply...`);
      const response = await aiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt
      });

      const replyText = response.text ? response.text.trim() : '';
      if (!replyText) return null;

      // 参照ナレッジIDの抽出 (例: KN-001)
      const match = replyText.match(/KN-\d{3}/);
      const linkedKnowledgeId = match ? match[0] : null;
      const isCandidate = !linkedKnowledgeId && !replyText.includes('参照ドキュメント');

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
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
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
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (err) {
      console.warn(`[GeminiService] Knowledge extraction failed (${err.message}). Falling back.`);
      return null;
    }
  },

  /**
   * ナレッジ改善ヒント（AIアドバイス）の生成
   */
  async generateKnowledgeHints({ question, answer, category }) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const prompt = `以下の登録FAQナレッジを評価し、ユーザーが迷わず自己解決できるようにするための改善アドバイス（不足している前提条件、追記すべき連絡先や注意点など）を50〜100文字程度で端的に提示してください。

カテゴリ: ${category}
質問: ${question}
回答: ${answer}`;

      const response = await aiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt
      });

      return response.text ? response.text.trim() : null;
    } catch (err) {
      return null;
    }
  }
};

module.exports = geminiService;
