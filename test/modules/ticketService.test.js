const test = require('node:test');
const assert = require('node:assert/strict');
const ticketService = require('../../server/ticketService');

test('【モジュール】ticketService 単体テスト', async (t) => {
  await t.test('getAll() がチケット一覧配列を返すこと', () => {
    const list = ticketService.getAll();
    assert.ok(Array.isArray(list));
    assert.ok(list.length > 0);
  });

  await t.test('getById() が指定チケットを取得できること', () => {
    const list = ticketService.getAll();
    const first = list[0];
    const found = ticketService.getById(first.id);
    assert.ok(found);
    assert.equal(found.id, first.id);
  });

  await t.test('getAll() でステータス絞り込みができること', () => {
    const all = ticketService.getAll();
    const targetStatus = all[0].status;
    const filtered = ticketService.getAll({ status: targetStatus });
    assert.ok(filtered.every(t => t.status === targetStatus));
  });

  await t.test('updateStatus() でステータスが更新されること', () => {
    const list = ticketService.getAll();
    const targetId = list[0].id;
    const updated = ticketService.updateStatus(targetId, '対応中');
    assert.ok(updated);
    assert.equal(updated.status, '対応中');
  });
});
