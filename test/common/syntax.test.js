const test = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');

test('【汎用】全JavaScriptファイルの構文チェック (Syntax Verification)', async (t) => {
  const targetDirs = ['server', 'scripts'];
  const jsFiles = [];

  function collectJsFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          results = results.concat(collectJsFiles(full));
        }
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        results.push(full);
      }
    }
    return results;
  }

  for (const dir of targetDirs) {
    const fullDir = path.join(PROJECT_ROOT, dir);
    jsFiles.push(...collectJsFiles(fullDir));
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
