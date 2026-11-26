const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');

test('【汎用】環境設定・秘密情報管理の整合性チェック (Env & Security Verification)', async (t) => {
  await t.test('.env.example が存在し必要な環境変数が定義されていること', () => {
    const examplePath = path.join(PROJECT_ROOT, '.env.example');
    assert.ok(fs.existsSync(examplePath), '.env.example が存在しません');

    const content = fs.readFileSync(examplePath, 'utf-8');
    assert.match(content, /GEMINI_API_KEY=/, 'GEMINI_API_KEY の定義がありません');
    assert.match(content, /GEMINI_MODEL=/, 'GEMINI_MODEL の定義がありません');
    assert.match(content, /TEAMS_WEBHOOK_URL=/, 'TEAMS_WEBHOOK_URL の定義がありません');
  });

  await t.test('.gitignore に .env が確実に登録されていること (秘密鍵漏洩防止)', () => {
    const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
    assert.ok(fs.existsSync(gitignorePath), '.gitignore が存在しません');

    const content = fs.readFileSync(gitignorePath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim());
    assert.ok(lines.includes('.env'), '.gitignore に .env の除外設定がありません');
  });
});
