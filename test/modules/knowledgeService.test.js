const test = require('node:test');
const assert = require('node:assert/strict');
const knowledgeService = require('../../server/knowledgeService');

test('【モジュール】knowledgeService 単体テスト', async (t) => {
  await t.test('getAll() がナレッジ一覧配列を返すこと', () => {
    const list = knowledgeService.getAll();
    assert.ok(Array.isArray(list), '戻り値が配列ではありません');
    assert.ok(list.length > 0, 'ナレッジが1件以上存在する必要があります');
  });

  await t.test('getById() が存在するIDのナレッジを返すこと', () => {
    const item = knowledgeService.getById('KN-001');
    assert.ok(item, 'KN-001 が取得できませんでした');
    assert.equal(item.id, 'KN-001');
    assert.equal(item.category, 'アカウント・権限');
  });

  await t.test('getById() が存在しないIDで null を返すこと', () => {
    const item = knowledgeService.getById('KN-NON-EXISTENT');
    assert.equal(item, null);
  });

  await t.test('search() がキーワードに合致するナレッジをスコアリングして返すこと', () => {
    const results = knowledgeService.search('アカウント');
    assert.ok(results.length > 0, '検索結果が0件です');
    assert.equal(results[0].id, 'KN-001');
  });

  await t.test('search() が空文字のときは全件を返すこと', () => {
    const all = knowledgeService.getAll();
    const results = knowledgeService.search('');
    assert.equal(results.length, all.length);
  });
});
