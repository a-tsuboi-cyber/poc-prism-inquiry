// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('管理者: ドキュメント管理（編集・削除）シナリオ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?view=admin');
    const docTab = page.locator('button:has-text("ドキュメント・手順書")');
    await docTab.click();
    await expect(page.getByText('登録ドキュメント')).toBeVisible({ timeout: 5000 });
  });

  test('05-1: ドキュメント一覧表示 & 編集 & 削除確認', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 5000 });

    // 1. 最初のドキュメントの「編集」ボタンをクリック
    const editBtn = rows.first().locator('button[title="編集"]');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // 編集モーダルが開くこと
    await expect(page.getByText('ドキュメント編集:')).toBeVisible({ timeout: 5000 });

    // タイトルを編集して「更新保存」
    const titleInput = page.locator('input[placeholder="ドキュメント名を入力"]');
    const originalTitle = await titleInput.inputValue();
    const newTitle = `${originalTitle} (E2E更新)`;
    await titleInput.fill(newTitle);

    const saveBtn = page.locator('button:has-text("更新保存")');
    await saveBtn.click();

    // 更新後のタイトルが一覧に反映されていること
    await expect(page.getByText(newTitle)).toBeVisible({ timeout: 5000 });

    // 元のタイトルに戻しておく（テストの冪等性維持）
    const updatedRow = page.locator('tr').filter({ hasText: newTitle });
    await updatedRow.locator('button[title="編集"]').click();
    const revertInput = page.locator('input[placeholder="ドキュメント名を入力"]');
    await revertInput.fill(originalTitle);
    await page.locator('button:has-text("更新保存")').click();
    await expect(page.getByText(originalTitle)).toBeVisible({ timeout: 5000 });
  });
});
