const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const documentService = require('../../server/documentService');

test('【モジュール】documentService 単体テスト', async (t) => {
  await t.test('getAll() がドキュメント一覧配列を返すこと', () => {
    const list = documentService.getAll();
    assert.ok(Array.isArray(list), '戻り値が配列ではありません');
    assert.ok(list.length > 0, '初期ドキュメントが1件以上存在する必要があります');
  });

  await t.test('getAll({ type: "manual" }) でマニュアルのみ絞り込めること', () => {
    const manuals = documentService.getAll({ type: 'manual' });
    assert.ok(manuals.length > 0, 'マニュアルが1件以上存在する必要があります');
    assert.ok(manuals.every(d => d.type === 'manual'), 'すべての要素のtypeがmanualである必要があります');
  });

  await t.test('getAll({ type: "knowledge" }) でナレッジのみ絞り込めること', () => {
    const knowledges = documentService.getAll({ type: 'knowledge' });
    assert.ok(knowledges.length > 0, 'ナレッジが1件以上存在する必要があります');
    assert.ok(knowledges.every(d => d.type === 'knowledge'), 'すべての要素のtypeがknowledgeである必要があります');
  });

  await t.test('getById() で存在するドキュメントが取得できること', () => {
    const list = documentService.getAll();
    const first = list[0];
    const found = documentService.getById(first.id);
    assert.ok(found);
    assert.equal(found.id, first.id);
    assert.equal(found.title, first.title);
  });

  await t.test('getById() で存在しないIDの場合に null を返すこと', () => {
    const found = documentService.getById('DOC-NON-EXISTENT');
    assert.equal(found, null);
  });

  await t.test('getKnowledgeDocumentsContent() がドキュメント（テキスト・PDF）の内容を抽出できること', async () => {
    const content = await documentService.getKnowledgeDocumentsContent();
    assert.ok(typeof content === 'string');
    assert.ok(content.length > 0, '抽出テキストが空ではありません');
    assert.ok(content.includes('【登録ドキュメント:'), 'ドキュメントヘッダーが含まれる必要があります');
  });

  await t.test('create() および delete() が正しくファイルを保存・削除できること', () => {
    // テスト用ダミーファイル作成
    const testBuffer = Buffer.from('テストドキュメント本文データ');
    const created = documentService.create({
      title: '単体テスト用一時ドキュメント',
      type: 'manual',
      user: { name: 'テスト実行者', email: 'test@example.com' },
      file: {
        originalname: 'test_temp.txt',
        size: testBuffer.length,
        buffer: testBuffer
      }
    });

    assert.ok(created.id);
    assert.equal(created.title, '単体テスト用一時ドキュメント');
    assert.equal(created.type, 'manual');

    // ファイルパス取得確認
    const fileInfo = documentService.getFilePath(created.id);
    assert.ok(fileInfo);
    assert.ok(fs.existsSync(fileInfo.path));

    // 削除確認
    const deleted = documentService.delete(created.id);
    assert.equal(deleted, true);
    assert.equal(documentService.getById(created.id), null);
    assert.equal(fs.existsSync(fileInfo.path), false);
  });

  await t.test('update() がドキュメントのタイトルと種別を正しく更新できること', () => {
    const testBuffer = Buffer.from('更新テスト用データ');
    const created = documentService.create({
      title: '更新前タイトル',
      type: 'knowledge',
      file: { originalname: 'update_test.txt', size: testBuffer.length, buffer: testBuffer }
    });

    const updated = documentService.update(created.id, {
      title: '更新後タイトル',
      type: 'manual'
    });
    assert.ok(updated);
    assert.equal(updated.title, '更新後タイトル');
    assert.equal(updated.type, 'manual');

    // クリーンアップ
    documentService.delete(created.id);
  });
});
