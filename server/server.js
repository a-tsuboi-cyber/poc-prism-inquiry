require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const geminiService = require('./integrations/gemini/geminiService');
const chatRoutes = require('./features/chat/chatRoutes');
const ticketRoutes = require('./features/tickets/ticketRoutes');
const knowledgeRoutes = require('./features/knowledge/knowledgeRoutes');
const documentRoutes = require('./features/documents/documentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 静的ファイルの配信 (React Viteビルド成果物 dist を優先)
const distPath = path.join(__dirname, '../public/dist');
const publicPath = path.join(__dirname, '../public');

if (require('fs').existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.use(express.static(publicPath));

// システム・AI設定ステータスAPI
app.get('/api/system/status', (req, res) => {
  res.json({
    aiMode: geminiService.isAvailable() ? 'gemini' : 'mock',
    model: geminiService.getModelName(),
    isGeminiActive: geminiService.isAvailable()
  });
});

// Featureルーターのマウント
app.use('/api', chatRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/documents', documentRoutes);

// サーバー起動
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`[PRISM Inquiry Server] Running at http://localhost:${PORT}`);
  console.log(`[PRISM AI Model] Target: ${geminiService.getModelName()}`);
  console.log(`[PRISM AI Status] ${geminiService.isAvailable() ? 'ONLINE (Gemini API Active)' : 'OFFLINE (Fallback Mock Active)'}`);
  console.log(`=======================================================`);
});

module.exports = app;
