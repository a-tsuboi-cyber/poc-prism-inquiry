const test = require('node:test');
const assert = require('node:assert/strict');
const geminiService = require('../../server/geminiService');

test('【モジュール】geminiService 単体テスト', async (t) => {
  await t.test('getModelName() が gemini-3.8-flash を返すこと', () => {
    const model = geminiService.getModelName();
    assert.equal(model, 'gemini-3.8-flash');
  });

  await t.test('isAvailable() が真偽値を返すこと', () => {
    const available = geminiService.isAvailable();
    assert.equal(typeof available, 'boolean');
  });

  await t.test('generateChatReply() は引数オブジェクトを受け取って正常に処理できること', async () => {
    // API呼び出しまたはフォールバック(null)のいずれかが返る（例外を投げない）
    const result = await geminiService.generateChatReply({
      message: 'テスト質問',
      conversationHistory: [],
      knowledgeList: []
    });
    // result はオブジェクトまたは null
    assert.ok(result === null || typeof result === 'object');
  });
});
