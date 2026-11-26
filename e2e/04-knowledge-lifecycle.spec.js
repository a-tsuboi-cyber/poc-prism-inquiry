// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('管理者: ナレッジ育成（ログ確認・新規・編集・削除）シナリオ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?view=admin');
  });

  test('04-1: やり取りログ履歴の確認 & 詳細モーダル表示', async ({ page }) => {
    // 「やり取りログ履歴」タブをクリック
    const convTab = page.locator('button:has-text("やり取りログ履歴")');
    await convTab.click();

    // 対話ログ一覧テーブルの最初の行をクリック
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 5000 });
    await rows.first().click();

    // 対話ログ詳細モーダルが表示されること
    await expect(page.getByText('対話ログ詳細:')).toBeVisible({ timeout: 5000 });

    // 閉じるボタンをクリック（フッター）
    const closeBtn = page.locator('button:has-text("閉じる")').last();
    await closeBtn.click();
    await expect(page.getByText('対話ログ詳細:')).not.toBeVisible();
  });

  test('04-2: ナレッジ新規登録 → 編集 → 削除のフルサイクル', async ({ page }) => {
    // 「ナレッジ管理」タブをクリック
    const knowTab = page.locator('button:has-text("ナレッジ管理")');
    await knowTab.click();

    // 1. 新規登録
    const newBtn = page.locator('button:has-text("ナレッジ新規登録")');
    await expect(newBtn).toBeVisible({ timeout: 5000 });
    await newBtn.click();

    // モーダル入力
    await page.locator('input[placeholder*="ユーザーからの想定される問い合わせ内容"]').fill('E2Eテスト用自動検証クエスチョン？');
    await page.locator('textarea[placeholder*="自己解決のための案内手順"]').fill('これはE2Eテストによって自動生成された回答です。');
    
    // 保存
    await page.locator('button[type="submit"]:has-text("保存")').click();

    // 一覧に追加されたナレッジが表示されていること（Geminiヒント生成時間を考慮して15s待機）
    await expect(page.getByText('E2Eテスト用自動検証クエスチョン？')).toBeVisible({ timeout: 15000 });

    // 2. 編集
    const targetRow = page.locator('tr').filter({ hasText: 'E2Eテスト用自動検証クエスチョン？' });
    await targetRow.click();

    // 編集モーダルで質問文を更新
    const qInput = page.locator('input[placeholder*="ユーザーからの想定される問い合わせ内容"]');
    await qInput.fill('E2Eテスト用自動検証クエスチョン（更新後）？');
    await page.locator('button[type="submit"]:has-text("保存")').click();

    // 更新後のテキストが表示されていること
    await expect(page.getByText('E2Eテスト用自動検証クエスチョン（更新後）？')).toBeVisible({ timeout: 15000 });

    // 3. 削除
    // confirmダイアログを自動承認
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const updatedRow = page.locator('tr').filter({ hasText: 'E2Eテスト用自動検証クエスチョン（更新後）？' });
    await updatedRow.click();

    const deleteBtn = page.locator('button:has-text("削除")');
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click();

    // 一覧から削除されていること
    await expect(page.getByText('E2Eテスト用自動検証クエスチョン（更新後）？')).not.toBeVisible({ timeout: 10000 });
  });
});
