// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('一般ユーザー: マニュアル参照・ダウンロードシナリオ', () => {
  test('02-1: マニュアルモーダル起動 & 一覧表示 & ダウンロード確認', async ({ page }) => {
    await page.goto('/');

    // ヘッダーの「📖 マニュアル」ボタンをクリック
    const manualBtn = page.locator('button:has-text("マニュアル")').first();
    await expect(manualBtn).toBeVisible({ timeout: 10000 });
    await manualBtn.click();

    // マニュアルモーダルが立ち上がること
    await expect(page.getByText('PRISM システムマニュアル・手順書一覧')).toBeVisible({ timeout: 5000 });

    // マニュアル一覧が表示されていること（ダウンロードリンクが存在する）
    const downloadLinks = page.locator('a[download]');
    const count = await downloadLinks.count();
    expect(count).toBeGreaterThan(0);

    // 最初のマニュアルのダウンロードリンク属性を確認
    const firstHref = await downloadLinks.first().getAttribute('href');
    expect(firstHref).toContain('/api/documents/');
    expect(firstHref).toContain('/download');

    // モーダルを閉じる（フッターの閉じるボタン）
    const closeBtn = page.locator('button:has-text("閉じる")').last();
    await closeBtn.click();

    // モーダルが非表示になったことを確認
    await expect(page.getByText('PRISM システムマニュアル・手順書一覧')).not.toBeVisible();
  });
});
