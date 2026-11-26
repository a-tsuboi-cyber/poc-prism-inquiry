const test = require('node:test');
const assert = require('node:assert/strict');
const conversationService = require('../../server/conversationService');

test('【モジュール】conversationService 単体テスト', async (t) => {
  await t.test('getAll() が会話履歴一覧配列を返すこと', () => {
    const list = conversationService.getAll();
    assert.ok(Array.isArray(list));
  });

  await t.test('summarizeForTicket() が未存在セッションでも安全にデフォルトサマリーを返すこと', async () => {
    const summary = await conversationService.summarizeForTicket('SES-NON-EXISTENT');
    assert.ok(summary);
    assert.ok(summary.subject);
    assert.ok(summary.category);
    assert.ok(summary.urgency);
  });
});
