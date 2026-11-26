const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

test('【汎用】データストアJSON整合性チェック (Datastore Integrity)', async (t) => {
  const jsonFiles = ['knowledge.json', 'tickets.json', 'conversations.json'];

  for (const filename of jsonFiles) {
    const filePath = path.join(DATA_DIR, filename);

    await t.test(`${filename} が存在し有効なJSON配列であること`, () => {
      assert.ok(fs.existsSync(filePath), `${filename} が存在しません`);
      const raw = fs.readFileSync(filePath, 'utf-8');
      let parsed;
      assert.doesNotThrow(() => {
        parsed = JSON.parse(raw);
      }, `${filename} のJSONパースに失敗しました`);

      assert.ok(Array.isArray(parsed), `${filename} のルートは配列である必要があります`);
    });
  }
});
