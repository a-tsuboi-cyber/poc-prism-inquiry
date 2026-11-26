const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL || '';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

const teamsService = {
  getWebhookUrl() {
    return process.env.TEAMS_WEBHOOK_URL || TEAMS_WEBHOOK_URL;
  },

  isConfigured() {
    return Boolean(this.getWebhookUrl());
  },

  /**
   * チケット起票用のAdaptive Cardペイロードを生成
   */
  buildTicketCard(ticket, baseUrl = APP_BASE_URL) {
    const urgencyColor = ticket.urgency === '高' ? 'Attention' : (ticket.urgency === '中' ? 'Warning' : 'Default');
    const createdDate = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('ja-JP') : new Date().toLocaleString('ja-JP');
    const directLink = `${baseUrl}/?view=admin&ticketId=${ticket.id}`;

    return {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          contentUrl: null,
          content: {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "TextBlock",
                size: "Medium",
                weight: "Bolder",
                text: "ユーザから問い合わせ通知を受領しました",
                color: "Accent"
              },
              {
                type: "FactSet",
                facts: [
                  { title: "チケットID:", value: ticket.id || "未採番" },
                  { title: "件名:", value: ticket.subject || "（件名なし）" },
                  { title: "起票者:", value: ticket.user ? `${ticket.user.name} (${ticket.user.email})` : "坪井 (a-tsuboi@ntv.co.jp)" },
                  { title: "カテゴリ:", value: ticket.category || "一般" },
                  { title: "緊急度:", value: ticket.urgency || "中" },
                  { title: "起票日時:", value: createdDate }
                ]
              },
              {
                type: "TextBlock",
                text: "**【問い合わせ詳細 / やり取り要約】**",
                weight: "Bolder",
                wrap: true,
                spacing: "Medium"
              },
              {
                type: "TextBlock",
                text: ticket.detail || "詳細は管理画面にてご確認ください。",
                wrap: true
              }
            ],
            actions: [
              {
                type: "Action.OpenUrl",
                title: "管理画面でチケット詳細を確認",
                url: directLink
              }
            ]
          }
        }
      ]
    };
  },

  /**
   * Teams Incoming Webhook への Adaptive Card 送信
   */
  async sendTicketNotification(ticket, baseUrl = APP_BASE_URL) {
    const cardPayload = this.buildTicketCard(ticket, baseUrl);
    const webhookUrl = this.getWebhookUrl();

    if (!webhookUrl) {
      console.log('-------------------------------------------------------');
      console.log('📢 [TeamsService Mock] Webhook URL未設定のためモック出力:');
      console.log(`[タイトル] ユーザから問い合わせ通知を受領しました`);
      console.log(`[チケット] ${ticket.id} (${ticket.subject}) / 緊急度: ${ticket.urgency}`);
      console.log(`[詳細URL] ${baseUrl}/?view=admin&ticketId=${ticket.id}`);
      console.log('-------------------------------------------------------');
      return { success: true, mocked: true, payload: cardPayload };
    }

    try {
      console.log(`[TeamsService] Sending Adaptive Card notification for ${ticket.id} to Teams...`);
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cardPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[TeamsService] Teams webhook responded with error: ${response.status} ${errorText}`);
        return { success: false, status: response.status, error: errorText };
      }

      console.log(`[TeamsService] Successfully posted notification for ${ticket.id} to Teams.`);
      return { success: true, mocked: false };
    } catch (err) {
      console.error(`[TeamsService] Failed to send Teams notification:`, err.message);
      return { success: false, error: err.message };
    }
  }
};

module.exports = teamsService;
