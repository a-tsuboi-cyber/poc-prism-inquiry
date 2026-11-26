const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'test', 'reports');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

console.log('=======================================================');
console.log('🚀 PRISM Full Test Suite Runner (Unit Tests + E2E Tests)');
console.log('=======================================================');

const startTime = Date.now();

// 1. フロントエンド最新ビルドの確認・実行
console.log('\n[Phase 1] Building Frontend Distribution (tsc -b && vite build)...');
const buildResult = spawnSync('npm', ['run', 'build'], {
  cwd: PROJECT_ROOT,
  stdio: 'inherit',
  shell: true
});

const buildSuccess = buildResult.status === 0;
if (!buildSuccess) {
  console.error('❌ Frontend build failed. Aborting tests.');
  process.exit(1);
}

// 2. 単体テスト実行
console.log('\n[Phase 2] Running Unit Tests...');
const unitResult = spawnSync('node', ['scripts/run-tests.js'], {
  cwd: PROJECT_ROOT,
  stdio: 'inherit',
  shell: true
});

const unitSuccess = unitResult.status === 0;

// 3. E2Eテスト実行 (Playwright)
console.log('\n[Phase 3] Running Playwright E2E Tests...');
const e2eResult = spawnSync('npx', ['playwright', 'test'], {
  cwd: PROJECT_ROOT,
  stdio: 'inherit',
  shell: true
});

const e2eSuccess = e2eResult.status === 0;

const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
const overallSuccess = buildSuccess && unitSuccess && e2eSuccess;

console.log('\n=======================================================');
console.log('📊 Overall Test Results Summary');
console.log('=======================================================');
console.log(`- フロントエンドビルド:   ${buildSuccess ? '✅ PASS' : '❌ FAIL'}`);
console.log(`- 単体テスト (Unit):    ${unitSuccess ? '✅ PASS' : '❌ FAIL'}`);
console.log(`- E2Eブラウザテスト:     ${e2eSuccess ? '✅ PASS' : '❌ FAIL'}`);
console.log(`- 総合所要時間:         ${durationSec}s`);
console.log(`- 総合判定:             ${overallSuccess ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
console.log('=======================================================');

// 統合レポート出力
const now = new Date();
const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
const reportFileName = `full-test-report-${timestamp}.md`;
const reportPath = path.join(REPORTS_DIR, reportFileName);

const reportContent = `# PRISM 総合テスト実行結果レポート (Full Test Report)

- **実行日時**: ${now.toLocaleString('ja-JP')}
- **所要時間**: ${durationSec}秒
- **総合判定**: ${overallSuccess ? '✅ **ALL PASS (全テスト合格)**' : '❌ **FAIL (不合格)**'}

---

## 1. テスト実行結果サマリー

| テストカテゴリ | 実行エンジン | 検証対象 | 判定 |
| :--- | :--- | :--- | :--- |
| **フロントエンドビルド** | Vite & TypeScript Compiler | TypeScript型チェックおよび最新Reactバンドル生成 | ${buildSuccess ? '✅ PASS' : '❌ FAIL'} |
| **単体テスト (Unit)** | Node.js Native Runner | 構文チェック、データストア整合性、各サービスクラス (58ケース) | ${unitSuccess ? '✅ PASS' : '❌ FAIL'} |
| **E2Eテスト (Browser)** | Playwright (Chromium) | チャット一次受け、マニュアル参照、チケット管理、ナレッジ育成、ドキュメント管理 (7ケース) | ${e2eSuccess ? '✅ PASS' : '❌ FAIL'} |

---

## 2. 詳細実行ログ
- 単体テストレポート: \`test/reports/\` 配下の最新レポートを参照
- Playwright HTMLレポート: \`npx playwright show-report test/reports/playwright-html\` で閲覧可能
`;

fs.writeFileSync(reportPath, reportContent, 'utf-8');
console.log(`📄 Integrated Report Saved: test/reports/${reportFileName}\n`);

if (!overallSuccess) {
  process.exit(1);
}
