const test = require('node:test');
const assert = require('node:assert/strict');
const teamsService = require('../../server/teamsService');

test('【モジュール】teamsService 単体テスト', async (t) => {
  const dummyTicket = {
    id: 'TICK-TEST-001',
    subject: 'テスト問い合わせ件名',
    detail: 'テスト問い合わせ詳細テキスト',
    category: 'システム不具合',
    urgency: '高',
    user: {
      name: 'テストユーザー',
      email: 'test@example.com'
    },
    createdAt: new Date().toISOString()
  };

  await t.test('buildTicketCard() が Microsoft Teams Adaptive Card v1.4 フォーマットを生成すること', () => {
    const card = teamsService.buildTicketCard(dummyTicket, 'http://localhost:3000');
    assert.ok(card);
    assert.equal(card.type, 'message');
    assert.ok(Array.isArray(card.attachments));
    assert.equal(card.attachments.length, 1);

    const attachment = card.attachments[0];
    assert.equal(attachment.contentType, 'application/vnd.microsoft.card.adaptive');
    assert.ok(attachment.content);
    assert.equal(attachment.content.type, 'AdaptiveCard');
    assert.equal(attachment.content.version, '1.4');

    // 本文構成チェック
    const body = attachment.content.body;
    assert.ok(Array.isArray(body));
    const titleBlock = body.find(b => b.type === 'TextBlock' && b.text === 'ユーザから問い合わせ通知を受領しました');
    assert.ok(titleBlock, 'タイトル「ユーザから問い合わせ通知を受領しました」が存在する必要があります');

    const factSet = body.find(b => b.type === 'FactSet');
    assert.ok(factSet, 'FactSet が存在する必要があります');
    const facts = factSet.facts;
    assert.ok(facts.some(f => f.title === 'チケットID:' && f.value === dummyTicket.id));
    assert.ok(facts.some(f => f.title === '件名:' && f.value === dummyTicket.subject));
    assert.ok(facts.some(f => f.title === 'カテゴリ:' && f.value === dummyTicket.category));
    assert.ok(facts.some(f => f.title === '緊急度:' && f.value === dummyTicket.urgency));

    // アクションボタンチェック
    const actions = attachment.content.actions;
    assert.ok(Array.isArray(actions));
    const openAction = actions.find(a => a.type === 'Action.OpenUrl');
    assert.ok(openAction);
    assert.equal(openAction.title, '管理画面でチケット詳細を確認');
    assert.equal(openAction.url, `http://localhost:3000/?view=admin&ticketId=${dummyTicket.id}`);
  });

  await t.test('sendTicketNotification() が Webhook URL 未設定時にモック送信として安全に正常終了すること', async () => {
    const originalUrl = process.env.TEAMS_WEBHOOK_URL;
    delete process.env.TEAMS_WEBHOOK_URL;

    const result = await teamsService.sendTicketNotification(dummyTicket);
    assert.ok(result);
    assert.equal(result.success, true);
    assert.equal(result.mocked, true);

    if (originalUrl) {
      process.env.TEAMS_WEBHOOK_URL = originalUrl;
    }
  });
});
