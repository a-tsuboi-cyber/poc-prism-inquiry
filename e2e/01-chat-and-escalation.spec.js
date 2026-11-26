// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('一般ユーザー: AIチャット一次受け & エスカレーションシナリオ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 一般ユーザー画面が表示されていることを確認
    await expect(page.locator('h1')).toContainText('PRISM 一次受けAI');
    await expect(page.getByText('一般ユーザ')).toBeVisible();
  });

  test('01-1: チャット質問送信 → AI回答受領 → クローズ（自己解決）', async ({ page }) => {
    // 質問入力
    const textarea = page.locator('textarea');
    await textarea.fill('アカウントの新規申請手順について教えてください');
    
    // 送信ボタン押下
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    // ユーザーメッセージが表示されること
    await expect(page.getByText('アカウントの新規申請手順について教えてください')).toBeVisible();

    // AIの回答が表示されるまで待機（Geminiまたはモックの回答）
    const aiMessages = page.locator('.prose-chat');
    await expect(aiMessages.first()).toBeVisible({ timeout: 15000 });

    // AIタイピングストリーミング終了を待つためボタンが活性化するのを待機
    const closeBtn = page.locator('button:has-text("解決した")');
    await expect(closeBtn).toBeEnabled({ timeout: 10000 });
    await closeBtn.click();

    // 解決済みフィードバックカードが表示されること
    await expect(page.getByText('お問い合わせが解決しました')).toBeVisible({ timeout: 5000 });
  });

  test('01-2: 未解決エスカレーション（フォーム自動要約・電話番号入力・チケット起票）', async ({ page }) => {
    // 質問入力
    const textarea = page.locator('textarea');
    await textarea.fill('本番環境でログイン時にエラーコード 500 が発生して業務が進みません。大至急対応してください。');
    
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    // 「解決しない（担当者へエスカレ）」ボタンが活性化するまで待機
    const escalateBtn = page.locator('button:has-text("解決しない（担当者へエスカレ）")');
    await expect(escalateBtn).toBeEnabled({ timeout: 15000 });
    await escalateBtn.click();

    // エスカレーションモーダルが表示されること
    await expect(page.getByText('サポート担当者へエスカレーション')).toBeVisible({ timeout: 5000 });

    // 緊急度を「高」に切り替え
    const urgencySelect = page.locator('select').filter({ hasText: /低/ });
    if (await urgencySelect.isVisible()) {
      await urgencySelect.selectOption('高');
    }

    // 緊急度「高」で電話番号入力欄が表示されるので入力
    const phoneInput = page.locator('input[placeholder*="090-XXXX-XXXX"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('090-1234-5678');
    }

    // 「チケット起票 & Teams通知」をクリック
    const submitBtn = page.locator('button:has-text("チケット起票 & Teams通知")');
    await submitBtn.click();

    // エスカレーション完了通知カードが表示されること
    await expect(page.getByText('サポート窓口（担当者）へエスカレーションしました')).toBeVisible({ timeout: 10000 });
  });
});
