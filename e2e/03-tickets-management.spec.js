// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('管理者: チケット一覧・詳細確認・ステータス更新シナリオ', () => {
  test.beforeEach(async ({ page }) => {
    // 管理者画面を開く
    await page.goto('/?view=admin');
    await expect(page.locator('button:has-text("チケット管理")')).toBeVisible({ timeout: 10000 });
  });

  test('03-1: チケット一覧表示 & 詳細確認 & ステータス変更', async ({ page }) => {
    // チケットテーブルが表示されていること
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 5000 });

    // 最初のチケット行をクリックして詳細モーダルを開く
    await rows.first().click();

    // チケット詳細モーダルが開くこと
    await expect(page.getByText('チケット詳細')).toBeVisible({ timeout: 5000 });

    // 状態変更ボタンで「完了」をクリック
    const completeBtn = page.locator('button:has-text("完了")').last();
    await completeBtn.click();
    await page.waitForTimeout(500);

    // モーダル内の閉じるボタンをクリック
    const closeBtn = page.locator('button:has-text("閉じる")').last();
    await closeBtn.click();

    // モーダルが閉じて一覧に戻ること
    await expect(page.getByText('チケット詳細')).not.toBeVisible();

    // 一覧のバッジ等で状態が反映されていることを確認
    await expect(page.locator('table tbody tr').first()).toContainText('完了');
  });
});
