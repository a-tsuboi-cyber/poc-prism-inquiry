# poc-prism-inquiry

PRISM一次受けAIアシスタント (PoC)

## 📌 概要
PRISMシステムを利用する社内外のユーザーからの問い合わせを生成AIで一次受けし、自己解決率向上と運用・開発チームの負荷軽減を図るWebアプリケーションです。
自己解決しなかった問い合わせは、自動要約・カテゴリ分類・緊急度判定を行ってチケットエスカレーションし、Teams連携で即時通知します。

## 📚 ドキュメント構成
- **要件定義書**:
  - [要件定義書 [初版 v1.0] (AI一次受け & チケット・ナレッジ基盤)](docs/requirements_v1.0_initial.md)
  - [要件定義書 [第1回エンハンス v1.1] (ドキュメント管理・マニュアル参照)](docs/requirements_v1.1_document_management.md)
  - [要件定義書 [第2回エンハンス v1.2] (Teams通知連携・Adaptive Card)](docs/requirements_v1.2_teams_notification.md)
- **設計書 & 環境定義**:
  - [データモデル設計書 & ER図 (v1.3.0)](docs/data_model_er.md)
  - [サービス・環境定義書 (v1.3.0)](docs/environment_definition.md)
  - [Git運用・ブランチ戦略](docs/git_structure.md)
  - [PRISM運用定義要約](docs/prism_knowledge_summary.md)
  - [単体テスト仕様書](test/specs/unit-test-spec.md)
  - [E2Eテスト検証方針 & 仕様書](docs/e2e_test_spec.md)

## 🚀 クイックスタート
```powershell
# 依存関係インストール
npm install
cd frontend && npm install && cd ..

# アプリケーション起動 (ポート3000)
npm start

# 単体テスト実行 (Unit Tests: 58ケース)
npm test

# E2Eブラウザテスト実行 (Playwright: 7シナリオ)
npm run test:e2e

# 総合テスト実行 (単体テスト + E2Eテストの一括実行 & レポート出力)
npm run test:all
```
