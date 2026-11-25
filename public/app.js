// グローバル状態
let currentUser = { name: "坪井", email: "a-tsuboi@ntv.co.jp", role: "user" };
let currentSessionId = `SES-${Date.now()}`;
let activeTicketSort = { key: 'createdAt', order: 'desc' };
let currentDetailTicketId = null;
let currentDetailKnowledgeId = null;
let currentDetailSessionId = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadTickets();
  loadConversations();
  loadKnowledge();
});

function setupEventListeners() {
  // ロール切り替え
  document.getElementById('roleSelect').addEventListener('change', (e) => {
    const role = e.target.value;
    currentUser.role = role;
    if (role === 'user') {
      currentUser.name = "坪井";
      currentUser.email = "a-tsuboi@ntv.co.jp";
      document.getElementById('currentUserName').textContent = `${currentUser.name} (${currentUser.email})`;
      document.getElementById('userView').style.display = 'flex';
      document.getElementById('adminView').style.display = 'none';
    } else {
      currentUser.name = "運用管理者";
      currentUser.email = "admin@ntv.co.jp";
      document.getElementById('currentUserName').textContent = `${currentUser.name} (${currentUser.email})`;
      document.getElementById('userView').style.display = 'none';
      document.getElementById('adminView').style.display = 'flex';
      loadTickets();
    }
  });

  // 管理者タブ切り替え
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      document.getElementById(targetId).style.display = 'flex';

      if (targetId === 'ticketsTab') loadTickets();
      if (targetId === 'conversationsTab') loadConversations();
      if (targetId === 'knowledgeTab') loadKnowledge();
    });
  });

  // チャット送信
  document.getElementById('btnSendMessage').addEventListener('click', handleSendMessage);
  document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSendMessage();
  });

  // 新規チャットボタン
  document.getElementById('btnNewChat').addEventListener('click', () => {
    currentSessionId = `SES-${Date.now()}`;
    const box = document.getElementById('chatMessages');
    box.innerHTML = `
      <div class="msg-bubble ai">
新しい会話を開始しました。PRISMに関するご質問をどうぞ！
      </div>
    `;
  });

  // クローズ（解決した）アクション
  document.getElementById('btnCloseAction').addEventListener('click', async () => {
    await fetch('/api/chat/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentSessionId, status: 'クローズ' })
    });
    appendMessage('system', '✨ よかった！問題が解決して何よりです。\n別の質問がある場合は、いつでも上の「新しい会話を開始」からお声がけください。');
  });

  // エスカレーション（解決しない）アクション
  document.getElementById('btnEscalateAction').addEventListener('click', async () => {
    // サーバーからAI要約データを取得
    const res = await fetch(`/api/chat/summary/${currentSessionId}`);
    const summary = await res.json();

    document.getElementById('escSubject').value = summary.subject;
    document.getElementById('escDetail').value = summary.detail;
    document.getElementById('escCategory').value = summary.category;
    document.getElementById('escUrgency').value = summary.urgency;
    document.getElementById('escPhone').value = '';

    openModal('escalateModal');
  });

  // チケット送信
  document.getElementById('btnSubmitEscalate').addEventListener('click', async () => {
    const subject = document.getElementById('escSubject').value;
    const detail = document.getElementById('escDetail').value;
    const category = document.getElementById('escCategory').value;
    const urgency = document.getElementById('escUrgency').value;
    const phoneNumber = document.getElementById('escPhone').value;

    if (!phoneNumber) {
      alert('緊急時連絡先（電話番号）を入力してください。');
      return;
    }

    const payload = {
      sessionId: currentSessionId,
      subject,
      detail,
      category,
      urgency,
      phoneNumber,
      user: { name: currentUser.name, email: currentUser.email }
    };

    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const created = await res.json();

    closeModal('escalateModal');
    appendMessage('system', `🚨 チケットを受け付けました（チケットID: ${created.id}）。\n運用チームより確認後、折り返しご連絡いたします。`);
  });

  // チケットフィルター＆ソート
  ['filterStatus', 'filterUrgency', 'filterCategory'].forEach(id => {
    document.getElementById(id).addEventListener('change', loadTickets);
  });
  document.getElementById('btnRefreshTickets').addEventListener('click', loadTickets);

  document.querySelectorAll('#ticketsTab th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const sortKey = th.getAttribute('data-sort');
      if (activeTicketSort.key === sortKey) {
        activeTicketSort.order = activeTicketSort.order === 'asc' ? 'desc' : 'asc';
      } else {
        activeTicketSort.key = sortKey;
        activeTicketSort.order = 'asc';
      }
      loadTickets();
    });
  });

  // チケットステータス更新
  document.getElementById('btnSaveTicketStatus').addEventListener('click', async () => {
    if (!currentDetailTicketId) return;
    const newStatus = document.getElementById('tdStatusSelect').value;
    await fetch(`/api/tickets/${currentDetailTicketId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    closeModal('ticketDetailModal');
    loadTickets();
    alert('チケットのステータスを更新しました。');
  });

  // やり取り詳細からのナレッジ登録
  document.getElementById('btnRefreshConversations').addEventListener('click', loadConversations);
  document.getElementById('btnRegisterExtractedKnowledge').addEventListener('click', async () => {
    const question = document.getElementById('convExtractedQ').value;
    const answer = document.getElementById('convExtractedA').value;
    const category = document.getElementById('convExtractedCategory').value;
    const tags = document.getElementById('convExtractedTags').value;

    if (!question || !answer) {
      alert('質問と回答を入力してください。');
      return;
    }

    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer, category, tags })
    });
    const created = await res.json();

    closeModal('conversationModal');
    loadConversations();
    loadKnowledge();
    alert(`ナレッジを登録しました！（ID: ${created.id}）`);
  });

  // ナレッジ手動新規作成
  document.getElementById('btnNewKnowledgeManual').addEventListener('click', () => {
    currentDetailKnowledgeId = null;
    document.getElementById('kdModalTitle').textContent = 'ナレッジ新規作成';
    document.getElementById('kdAiHint').style.display = 'none';
    document.getElementById('kdQuestion').value = '';
    document.getElementById('kdAnswer').value = '';
    document.getElementById('kdCategory').value = 'アカウント・権限';
    document.getElementById('kdTags').value = '';
    openModal('knowledgeDetailModal');
  });

  // ナレッジ保存（新規または更新）
  document.getElementById('btnSaveKnowledge').addEventListener('click', async () => {
    const question = document.getElementById('kdQuestion').value;
    const answer = document.getElementById('kdAnswer').value;
    const category = document.getElementById('kdCategory').value;
    const tags = document.getElementById('kdTags').value;

    if (!question || !answer) {
      alert('質問と回答を入力してください。');
      return;
    }

    if (currentDetailKnowledgeId) {
      await fetch(`/api/knowledge/${currentDetailKnowledgeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, category, tags })
      });
      alert('ナレッジを更新しました。');
    } else {
      await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, category, tags })
      });
      alert('新規ナレッジを作成しました。');
    }
    closeModal('knowledgeDetailModal');
    loadKnowledge();
  });

  // ナレッジ検索
  document.getElementById('knowledgeSearchInput').addEventListener('input', (e) => {
    loadKnowledge(e.target.value);
  });
}

// チャット発話
async function handleSendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  appendMessage('user', text);
  input.value = '';

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: currentSessionId,
      user: { name: currentUser.name, email: currentUser.email },
      message: text
    })
  });

  const data = await res.json();
  appendMessage('ai', data.aiMessage);
}

function appendMessage(sender, text) {
  const box = document.getElementById('chatMessages');
  const el = document.createElement('div');
  el.className = `msg-bubble ${sender}`;
  el.textContent = text;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

// チケット一覧読み込み
async function loadTickets() {
  const status = document.getElementById('filterStatus').value;
  const urgency = document.getElementById('filterUrgency').value;
  const category = document.getElementById('filterCategory').value;
  const { key: sortKey, order: sortOrder } = activeTicketSort;

  const res = await fetch(`/api/tickets?status=${status}&urgency=${urgency}&category=${category}&sortKey=${sortKey}&sortOrder=${sortOrder}`);
  const list = await res.json();

  const tbody = document.getElementById('ticketTableBody');
  tbody.innerHTML = '';

  list.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${t.id}</strong></td>
      <td>${t.subject}</td>
      <td>${t.category}</td>
      <td><span class="badge badge-urgency-${t.urgency === '高' ? 'high' : (t.urgency === '中' ? 'mid' : 'low')}">${t.urgency}</span></td>
      <td>${t.user.name}</td>
      <td>${t.linkedKnowledgeId ? `<span class="chip">${t.linkedKnowledgeId}</span>` : '-'}</td>
      <td><span class="badge badge-status-${getStatusBadgeClass(t.status)}">${t.status}</span></td>
      <td>${new Date(t.createdAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
    `;
    tr.addEventListener('click', () => openTicketDetail(t.id));
    tbody.appendChild(tr);
  });
}

function getStatusBadgeClass(status) {
  if (status === '新規') return 'new';
  if (status === '対応中') return 'prog';
  if (status === 'ユーザー確認待ち') return 'wait';
  return 'done';
}

// チケット詳細モーダル
async function openTicketDetail(id) {
  currentDetailTicketId = id;
  const res = await fetch(`/api/tickets/${id}`);
  const { ticket, conversation } = await res.json();

  document.getElementById('tdModalTitle').textContent = `チケット詳細: ${ticket.id} - ${ticket.subject}`;
  document.getElementById('tdStatusSelect').value = ticket.status;
  document.getElementById('tdUserInfo').innerHTML = `
    <strong>起票者:</strong> ${ticket.user.name} (${ticket.user.email})<br>
    <strong>緊急連絡先:</strong> 📞 ${ticket.phoneNumber || '未登録'}<br>
    <strong>緊急度:</strong> ${ticket.urgency} ｜ <strong>カテゴリ:</strong> ${ticket.category}
  `;
  document.getElementById('tdDetail').textContent = ticket.detail;

  const logBox = document.getElementById('tdConversationLogs');
  logBox.innerHTML = '';
  if (conversation && conversation.messages) {
    conversation.messages.forEach(m => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `log-item ${m.sender}`;
      msgDiv.innerHTML = `<strong>${m.sender === 'user' ? '👤 ユーザー' : '🤖 AI'} (${m.timestamp}):</strong><br>${m.text}`;
      logBox.appendChild(msgDiv);
    });
  } else {
    logBox.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">関連する対話履歴がありません。</p>';
  }

  openModal('ticketDetailModal');
}

// やり取り一覧読み込み
async function loadConversations() {
  const res = await fetch('/api/conversations');
  const list = await res.json();

  const tbody = document.getElementById('conversationTableBody');
  tbody.innerHTML = '';

  list.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${c.sessionId}</strong></td>
      <td>${c.topic || '-'}</td>
      <td>${c.user.name}</td>
      <td>${c.status}</td>
      <td>${c.linkedKnowledgeId ? `<span class="chip">${c.linkedKnowledgeId}</span>` : '-'}</td>
      <td>${c.isKnowledgeCandidate ? '<span class="badge-recommend">🌟 推奨</span>' : '<span style="color:#94a3b8; font-size:12px;">通常</span>'}</td>
      <td>${new Date(c.startedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
    `;
    tr.addEventListener('click', () => openConversationDetail(c.sessionId));
    tbody.appendChild(tr);
  });
}

// やり取り詳細 & ナレッジ抽出モーダル
async function openConversationDetail(sessionId) {
  currentDetailSessionId = sessionId;
  const res = await fetch(`/api/conversations/${sessionId}`);
  const conv = await res.json();

  const summaryRes = await fetch(`/api/chat/summary/${sessionId}`);
  const summary = await summaryRes.json();

  document.getElementById('convModalTitle').textContent = `やり取り詳細 & ナレッジ抽出 (${sessionId})`;

  // 左側: 実対話
  const logBox = document.getElementById('convModalLogs');
  logBox.innerHTML = '';
  conv.messages.forEach(m => {
    const msgDiv = document.createElement('div');
    msgDiv.className = `log-item ${m.sender}`;
    msgDiv.innerHTML = `<strong>${m.sender === 'user' ? '👤 ユーザー' : '🤖 AI'} (${m.timestamp}):</strong><br>${m.text}`;
    logBox.appendChild(msgDiv);
  });

  // 右側: ナレッジ登録初期値
  document.getElementById('convExtractedQ').value = summary.suggestedQuestion || conv.topic;
  document.getElementById('convExtractedA').value = summary.suggestedAnswer || '';
  document.getElementById('convExtractedCategory').value = summary.category;
  document.getElementById('convExtractedTags').value = '';

  openModal('conversationModal');
}

// ナレッジ一覧読み込み
async function loadKnowledge(q = '') {
  const res = await fetch(`/api/knowledge${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  const list = await res.json();

  const tbody = document.getElementById('knowledgeTableBody');
  tbody.innerHTML = '';

  list.forEach(k => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="chip">${k.id}</span></td>
      <td><strong>${k.category}</strong></td>
      <td>${k.question}</td>
      <td>${(k.tags || []).join(', ')}</td>
      <td>${k.usageCount || 0} 回</td>
      <td>${new Date(k.updatedAt).toLocaleDateString('ja-JP')}</td>
    `;
    tr.addEventListener('click', () => openKnowledgeDetail(k.id));
    tbody.appendChild(tr);
  });
}

// ナレッジ詳細編集モーダル
async function openKnowledgeDetail(id) {
  currentDetailKnowledgeId = id;
  const res = await fetch('/api/knowledge');
  const list = await res.json();
  const k = list.find(item => item.id === id);
  if (!k) return;

  document.getElementById('kdModalTitle').textContent = `ナレッジ詳細・編集: ${k.id}`;
  const hintBox = document.getElementById('kdAiHint');
  if (k.aiHints) {
    hintBox.style.display = 'block';
    hintBox.innerHTML = `💡 <strong>AIアドバイス（改善ヒント）:</strong><br>${k.aiHints}`;
  } else {
    hintBox.style.display = 'none';
  }

  document.getElementById('kdQuestion').value = k.question;
  document.getElementById('kdAnswer').value = k.answer;
  document.getElementById('kdCategory').value = k.category;
  document.getElementById('kdTags').value = (k.tags || []).join(', ');

  openModal('knowledgeDetailModal');
}

// モーダルユーティリティ
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}
