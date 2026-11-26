const test = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');

test('【汎用】全JavaScriptファイルの構文チェック (Syntax Verification)', async (t) => {
  const targetDirs = ['server', 'scripts'];
  const jsFiles = [];

  for (const dir of targetDirs) {
    const fullDir = path.join(PROJECT_ROOT, dir);
    if (!fs.existsSync(fullDir)) continue;
    const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.js'));
    for (const f of files) {
      jsFiles.push(path.join(fullDir, f));
    }
  }

  for (const file of jsFiles) {
    const relPath = path.relative(PROJECT_ROOT, file);
    await t.test(`構文妥当性: ${relPath}`, () => {
      assert.doesNotThrow(() => {
        execSync(`node --check "${file}"`, { stdio: 'pipe' });
      }, `${relPath} に構文エラーが存在します`);
    });
  }
});
