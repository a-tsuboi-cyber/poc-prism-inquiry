# PRISM一次受けAIアシスタント 要件定義書（機能拡張：Teams通知連携）

- **システム名称**: PRISM一次受けAIアシスタント (`poc-prism-inquiry`)
- **ドキュメント種別**: 機能拡張（エンハンス）要件定義書
- **作成日**: 2026-11-26
- **バージョン**: 1.0.0
- **対象ブランチ**: `feature/teams-notification`
- **関連ドキュメント**: [基本要件定義書](./requirements_definition.md) / [ドキュメント管理要件定義書](./requirements_document_management.md)

---

## 1. 機能概要・目的

ユーザーが一次受けAIチャットで自己解決せず、運用チーム宛てに「エスカレーション（チケット起票）」を行った際に、運用担当者が常駐する **Microsoft Teams の指定チャネルへ Adaptive Card（アダプティブカード）形式で即時通知** を送信する。  
これにより、問い合わせ見落としを防止し、Teams上の通知からワンクリックで管理画面の該当チケット詳細ポップアップへ直接アクセスできるようにして、一次対応の初動を迅速化する。

---

## 2. システム要件・通知トリガー

### 2.1. 通知タイミング（トリガー条件）
- ユーザーがチャット画面の「エスカレーション」ボタンを押し、入力フォーム（またはAI自動要約）を経て **チケットの起票（`POST /api/tickets`）が完了した瞬間**。
- ※通常チャットの発話ごとには通知せず、運用チームの介入が必要なチケット化イベント時のみ発報する。

### 2.2. Webhook URL および環境変数管理
- Webhook URL は秘密情報として `.env` ファイル内の環境変数 `TEAMS_WEBHOOK_URL` で管理する。
- リポジトリ共有用テンプレート（`.env.example`）に `TEAMS_WEBHOOK_URL=` を定義する。
- **未設定時フォールバック**:
  - `TEAMS_WEBHOOK_URL` が未設定、または無効な場合は、エラーでチケット起票処理を落とさず、コンソールログに生成された Adaptive Card JSON を出力して正常終了する。

---

## 3. Adaptive Card 仕様・レイアウト設計

Microsoft Teams Incoming Webhook 形式（Adaptive Card v1.4）に準拠する。

### 3.1. ヘッダー・タイトル
- **カードタイトル**: `ユーザから問い合わせ通知を受領しました`
- **アクセント**: チケット緊急度（高: 警告色/Red、中: 強調色/Accent、低: 通常）

### 3.2. 表示項目（FactSet / TextBlock）
| 項目名 | 内容 | 備考 |
| :--- | :--- | :--- |
| **チケットID** | 例: `TICK-20261126-003` | ユニーク識別子 |
| **起票日時** | 例: `2026/11/26 10:48:00` | 日本時間（JST） |
| **問い合わせ件名** | ユーザー入力またはAI自動要約件名 | 太字表示 |
| **起票者** | 氏名（メールアドレス） | 例: `坪井 (a-tsuboi@ntv.co.jp)` |
| **カテゴリ** | アカウント・権限 / システム不具合 / 操作方法 / 一般 | ラベル表示 |
| **緊急度** | 高 / 中 / 低 | 色分けバッジ |
| **問い合わせ詳細** | 困りごとの内容および対話サマリー | 複数行テキスト |

### 3.3. アクションボタン（Action.OpenUrl）
- **ボタン表示名**: `管理画面でチケット詳細を確認`
- **遷移先URL**: `http://localhost:3000/?view=admin&ticketId={ticketId}`
- **画面連動要件**:
  - URLクエリパラメータに `view=admin` および `ticketId` が指定されている場合、ブラウザ初期ロード時に管理者ビューへ自動切り替えし、該当チケットの詳細モーダルポップアップを自動オープンする。

---

## 4. アーキテクチャおよび改修対象モジュール

1. **環境変数管理**:
   - `.env.example`: `TEAMS_WEBHOOK_URL=` の追加
2. **バックエンド**:
   - `server/teamsService.js`（新規）:
     - Adaptive Card JSON の生成（`buildTicketCard(ticket)`）
     - Teams Incoming Webhook への HTTP POST 送信（`sendTicketNotification(ticket)`）
     - 未設定時のモックログ出力
   - `server/server.js`:
     - チケット作成エンドポイント（`POST /api/tickets`）内で `teamsService.sendTicketNotification(ticket)` を非同期呼び出し
3. **フロントエンド**:
   - `public/app.js`:
     - ページ読み込み時の URL パラメータ解析（`URLSearchParams`）
     - `?view=admin&ticketId=TICK-xxx` 検知時に管理者タブ切り替え ＋ `showTicketDetail(ticketId)` の自動実行
4. **単体テスト**:
   - `test/modules/teamsService.test.js`:
     - カード構造の生成検証
     - Webhook送信（未設定時・モック送信）の例外なし終了の検証
   - `test/common/env.test.js`:
     - `.env.example` のキー整合性チェック
