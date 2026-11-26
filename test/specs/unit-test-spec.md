# PRISM一次受けAIアシスタント 単体テスト仕様書 (Unit Test Specification)

- **システム名称**: PRISM一次受けAIアシスタント (`poc-prism-inquiry`)
- **作成日**: 2026-11-26
- **バージョン**: 1.0.0
- **関連ドキュメント**: [要件定義書 (初版 v1.0)](../../docs/requirements_v1.0_initial.md) / [データモデル設計書](../../docs/data_model_er.md) / [環境定義書](../../docs/environment_definition.md)

---

## 1. テスト方針と目的

本システムにおける品質担保およびGitプッシュ前の回帰防止のため、以下の2層アーキテクチャによる単体テスト（ユニットテスト）を実施する：
1. **プロジェクト非依存テスト（共通テスト）**: ファイル構文、環境変数設定、データストア整合性を担保。
2. **モジュール固有テスト**: 各サービスクラスの入出力、ビジネスロジック、スコアリング、フォールバックの妥当性を担保。

---

## 2. テストケース一覧

### 2.1. プロジェクト非依存テスト (Common)

| ファイル | テスト項目 | 観点 / 期待値 |
| :--- | :--- | :--- |
| `syntax.test.js` | 全JavaScriptファイルの構文チェック | `server/`, `scripts/` 配下の全 `.js` ファイルで `node --check` が正常終了すること |
| `env.test.js` | `.env.example` の存在とキー定義 | `GEMINI_API_KEY` と `GEMINI_MODEL` が定義されていること |
| `env.test.js` | 秘密情報の漏洩防止チェック | `.gitignore` に `.env` が確実に指定されていること |
| `datastore.test.js` | データストアJSONの整合性 | `knowledge.json`, `tickets.json`, `conversations.json`, `documents.json` が有効なJSON配列であること |

---

### 2.2. モジュール固有テスト (Modules)

| モジュール | テスト項目 | 観点 / 期待値 |
| :--- | :--- | :--- |
| `knowledgeService` | `getAll()` | ナレッジ一覧が1件以上の配列で取得できること |
| `knowledgeService` | `getById()` (正常) | 実在するナレッジID（`KN-001`）で正しいレコードが返ること |
| `knowledgeService` | `getById()` (異常) | 存在しないIDで `null` が返ること |
| `knowledgeService` | `search()` (キーワード) | キーワード「アカウント」で最もスコアの高い `KN-001` が先頭に返ること |
| `knowledgeService` | `search()` (空文字) | 空文字クエリで全件が返ること |
| `ticketService` | `getAll()` | チケット一覧が配列で取得できること |
| `ticketService` | `getById()` | 指定IDのチケットが取得できること |
| `ticketService` | ステータス絞り込み | `status` パラメータで指定ステータスのみに絞り込めること |
| `ticketService` | `updateStatus()` | 指定IDのステータスが更新されること |
| `conversationService` | `getAll()` | 会話ログ一覧が配列で取得できること |
| `conversationService` | `summarizeForTicket()` | 存在しないセッションIDでも例外なくデフォルトサマリーが生成されること |
| `geminiService` | `getModelName()` | 環境変数またはデフォルトの `gemini-3.8-flash` が返ること |
| `geminiService` | `isAvailable()` | APIキーの有無に応じた真偽値（boolean）が返ること |
| `geminiService` | `generateChatReply()` | 呼び出し時に例外を投げず、応答またはフォールバック（`null`）が返ること |
| `documentService` | `getAll()` | ドキュメント一覧が配列で取得できること |
| `documentService` | 種別絞り込み (`type`) | `manual` または `knowledge` の指定種別のみに絞り込めること |
| `documentService` | `getById()` (正常/異常) | 実在IDで取得でき、存在しないIDで `null` が返ること |
| `documentService` | `getKnowledgeDocumentsContent()` | ナレッジおよびマニュアル（TXT, MD, CSV, JSON, PDF）のドキュメント内容をテキスト抽出しAIプロンプト用に統合できること |
| `documentService` | `create()` & `delete()` | ドキュメントのアップロード登録と物理ファイル削除・データ削除が正常に動作すること |
| `teamsService` | `buildTicketCard()` | Teams Adaptive Card v1.4 フォーマット、タイトル、FactSet、OpenUrlアクションが正しく生成されること |
| `teamsService` | `sendTicketNotification()` | Webhook URL 未設定時でもモック送信として例外なく安全に正常終了すること |

---

## 3. テスト実行と結果記録

- **実行コマンド**: `npm test`（または `node scripts/run-tests.js`）
- **結果レポート保存先**: `test/reports/test-report-YYYYMMDD-HHmmss.md`
