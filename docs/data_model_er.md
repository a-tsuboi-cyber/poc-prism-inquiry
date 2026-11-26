# データモデル設計書 & ER図 (Data Model & ER Diagram)

- **システム名称**: PRISM一次受けAIアシスタント (`poc-prism-inquiry`)
- **作成日**: 2026-11-25 (最新更新: 2026-11-26)
- **バージョン**: 1.3.0
- **関連ドキュメント**: 
  - [要件定義書 (初版 v1.0)](requirements_v1.0_initial.md)
  - [要件定義書 (ドキュメント管理 v1.1)](requirements_v1.1_document_management.md)
  - [要件定義書 (Teams連携 v1.2)](requirements_v1.2_teams_notification.md)
  - [環境定義書](environment_definition.md)

---

## 1. エンティティ関連図 (Entity-Relationship Diagram)

```mermaid
erDiagram
    USER ||--o{ CONVERSATION : "開始する"
    USER ||--o{ TICKET : "起票する"
    USER ||--o{ DOCUMENT : "アップロード・保守"
    USER }o--o{ DOCUMENT : "マニュアル参照・DL"
    CONVERSATION ||--o| TICKET : "エスカレーションされる"
    KNOWLEDGE ||--o{ CONVERSATION : "FAQとして参照"
    KNOWLEDGE ||--o{ TICKET : "紐づく"
    DOCUMENT }o--o{ CONVERSATION : "一次受けコンテキストに注入"
    CONVERSATION ||--o| KNOWLEDGE : "ナレッジ抽出・昇格"

    USER {
        string email PK "メールアドレス (例: a-tsuboi@ntv.co.jp)"
        string name "氏名"
        string role "ロール (user / admin)"
    }

    CONVERSATION {
        string sessionId PK "セッションID (例: SES-20261125-001)"
        string userEmail FK "起票ユーザーEmail"
        string topic "主トピック"
        string status "進行状況 (進行中 / クローズ / エスカレーション)"
        string linkedKnowledgeId FK "参照ナレッジID (Nullable)"
        boolean isKnowledgeCandidate "ナレッジ推奨フラグ"
        json messages "発話履歴配列 [sender, text, timestamp]"
        datetime startedAt "開始日時"
    }

    TICKET {
        string id PK "チケットID (例: TICK-20261125-001)"
        string sessionId FK "元セッションID"
        string userEmail FK "起票ユーザーEmail"
        string subject "件名 (AI自動要約 / ユーザー編集)"
        string detail "問い合わせ詳細"
        string category "カテゴリ (アカウント・権限 / システム不具合 等)"
        string urgency "緊急度 (高 / 中 / 低)"
        string phoneNumber "緊急時連絡先 (電話番号、緊急度高で入力推奨)"
        string linkedKnowledgeId FK "参照ナレッジID (Nullable)"
        string status "対応状況 (新規 / 対応中 / 確認待ち / 完了)"
        datetime createdAt "起票日時"
        datetime updatedAt "更新日時"
    }

    KNOWLEDGE {
        string id PK "ナレッジID (例: KN-001)"
        string category "カテゴリ"
        string question "質問文 (Q)"
        string answer "回答文 (A)"
        array tags "タグ配列"
        string aiHints "Gemini改善アドバイス"
        int usageCount "参照回数"
        datetime updatedAt "最終更新日時"
    }

    DOCUMENT {
        string id PK "ドキュメントID (例: DOC-20261126-001)"
        string title "ドキュメント表示名・論理名"
        string type "ドキュメント種別 (knowledge / manual)"
        string originalFileName "元ファイル名"
        string fileExtension "拡張子 (.pdf / .txt / .md)"
        int fileSize "ファイルサイズ (bytes)"
        string storedFileName "保存物理ファイル名 (uploads/documents/)"
        string uploadedBy "アップロード担当者 (氏名・Email)"
        datetime createdAt "登録日時"
    }
```

---

## 2. エンティティ詳細定義

### 2.1. ユーザー (`USER`)
システム利用者の基本情報を保持するエンティティ。  
PoCフェーズでは外部認証基盤を介さず、ヘッダーのセレクターにより擬似的に切り替える。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| **email** | string | PK | ユーザーを一意に識別するメールアドレス |
| **name** | string | Not Null | 氏名（またはパートナー企業・担当者名） |
| **role** | string | Not Null | ロール (`user`: 一般ユーザー / `admin`: 管理ユーザー) |

---

### 2.2. やり取りログ (`CONVERSATION`)
一般ユーザーとAIアシスタントのチャット対話セッションを記録するエンティティ。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| **sessionId** | string | PK | セッション識別子 (`SES-YYYYMMDD-XXX`) |
| **userEmail** | string | FK | 開始したユーザーのEmail |
| **topic** | string | | 初回質問内容から推測された主トピック |
| **status** | string | Not Null | セッション状態 (`進行中` / `クローズ` / `エスカレーション`) |
| **linkedKnowledgeId** | string | FK / Nullable | 回答時に参照・引用したナレッジID |
| **isKnowledgeCandidate** | boolean | Not Null | 新規ナレッジ化推奨フラグ（AI自動判定） |
| **messages** | json | Not Null | 発話履歴配列（発話者、発話テキスト、タイムスタンプ） |
| **startedAt** | datetime | Not Null | 対話開始日時 |

---

### 2.3. チケット (`TICKET`)
自己解決せず、運用・開発チームへエスカレーションされた問い合わせエンティティ。  
起票と同時に Microsoft Teams 連携（Adaptive Card）が発報される。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| **id** | string | PK | チケットID (`TICK-YYYYMMDD-XXX`) |
| **sessionId** | string | FK | エスカレーション元のやり取りセッションID |
| **userEmail** | string | FK | 起票者のEmail |
| **subject** | string | Not Null | 問い合わせ件名（Gemini自動要約初期値、編集可能） |
| **detail** | string | Not Null | 問い合わせ詳細本文 |
| **category** | string | Not Null | カテゴリ（アカウント・権限 / システム不具合 / 操作方法 等） |
| **urgency** | string | Not Null | 緊急度（`高` / `中` / `低`） |
| **phoneNumber** | string | Nullable | 緊急時連絡先（電話番号、緊急度「高」選択時に入力欄出現） |
| **linkedKnowledgeId** | string | FK / Nullable | 紐づくナレッジID |
| **status** | string | Not Null | 対応状況 (`新規` / `対応中` / `確認待ち` / `完了`) |
| **createdAt** | datetime | Not Null | 起票日時 |
| **updatedAt** | datetime | Not Null | 最終更新日時 |

---

### 2.4. ナレッジ (`KNOWLEDGE`)
AIチャットの回答参照元であり、運用者が継続的に保守・拡充するQ&Aエンティティ。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| **id** | string | PK | ナレッジID (`KN-XXX`) |
| **category** | string | Not Null | カテゴリ分類 |
| **question** | string | Not Null | 想定される質問文 (Q) |
| **answer** | string | Not Null | 正答・案内内容 (A) |
| **tags** | array | | 検索用キーワード・タグ配列 |
| **aiHints** | string | | Geminiによる情報の過不足・改善アドバイスコメント |
| **usageCount** | int | Default 0 | AIチャットで参照・回答に利用された回数 |
| **updatedAt** | datetime | Not Null | 最終更新日時 |

---

### 2.5. ドキュメント (`DOCUMENT`)
管理者がアップロードしたPDF/テキスト/Markdown等の元データ。  
「ナレッジ」種別はAIチャット回答のコンテキストに自動展開され、「マニュアル」種別は一般ユーザーが参照・ダウンロードできる。

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| **id** | string | PK | ドキュメントID (`DOC-YYYYMMDD-XXX`) |
| **title** | string | Not Null | ドキュメント表示名・論理名 |
| **type** | string | Not Null | 種別 (`knowledge`: AIナレッジ元 / `manual`: ユーザー公開マニュアル) |
| **originalFileName** | string | Not Null | アップロード時の元ファイル名 |
| **fileExtension** | string | Not Null | 拡張子 (`.pdf`, `.md`, `.txt` 等) |
| **fileSize** | int | Not Null | ファイル容量（バイト単位） |
| **storedFileName** | string | Not Null | 実ファイル保存名 (`uploads/documents/` 配下) |
| **uploadedBy** | string | Not Null | アップロード担当者 |
| **createdAt** | datetime | Not Null | 登録日時 |

---

## 3. リレーションシップの特性と業務的意義

1. **セッションとチケットの完全追跡 (`1:1`)**:
   - チケットは対話ログ（`CONVERSATION`）から起票されるため、管理画面では単なる問い合わせ要約だけでなく、**「ユーザーがAIと交わした全発話ログ」を完全再現して閲覧可能**。
2. **やり取りログからナレッジへの昇格 (`1:1`)**:
   - 未解決の対話ログ（`isKnowledgeCandidate: true`）から、Geminiの要約支援を受けてワンクリックで新しいナレッジ（`KNOWLEDGE`）を生成できる。
3. **ドキュメントによるRAG（検索拡張生成）と自己解決支援**:
   - `type: knowledge` のドキュメント（業務手順書や仕様書PDF等）からテキストを抽出してGeminiプロンプトに注入することで、Q&Aを手動登録する前でもAIが高度な回答を提供できる。
   - `type: manual` のドキュメントはユーザー画面の「マニュアル参照」から即座に一覧・ダウンロードでき、人的エスカレーションを未然に防ぐ。
4. **Microsoft Teams 連携による即時トリアージ**:
   - チケット起票時に `TICKET` の属性（件名、緊急度、カテゴリ、起票者、電話番号等）をAdaptive Card化してTeamsに投稿。Teams上のディープリンクから該当チケットの管理モーダルへ直接遷移できる。
