// グローバル状態
let currentUser = { name: "坪井", email: "a-tsuboi@ntv.co.jp", role: "user" };
let currentSessionId = `SES-${Date.now()}`;
let activeTicketSort = { key: 'createdAt', order: 'desc' };
let currentDetailTicketId = null;
let currentDetailKnowledgeId = null;
let currentDetailSessionId = null;
let selectedUploadFile = null;
let deletingDocId = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadSystemStatus();
  loadTickets();
  loadConversations();
  loadKnowledge();
  loadDocuments();
});

function loadSystemStatus() {
  fetch('/api/system/status')
    .then(res => res.json())
    .then(data => {
      const badge = document.getElementById('aiStatusBadge');
      if (!badge) return;
      if (data.isGeminiActive) {
        badge.textContent = `⚡ AI: ${data.model} (Online)`;
        badge.style.background = '#dcfce7';
        badge.style.color = '#166534';
      } else {
        badge.textContent = `🛡️ AI: ${data.model} (Mock Fallback)`;
        badge.style.background = '#f1f5f9';
        badge.style.color = '#475569';
      }
    })
    .catch(() => {});
}

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
      if (targetId === 'documentsTab') loadDocuments();
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

  // ========== ドキュメント管理関連イベント (新機能) ==========
  // フィルター・ソート
  document.getElementById('docFilterType').addEventListener('change', loadDocuments);
  document.getElementById('docSortOrder').addEventListener('change', loadDocuments);

  // 登録モーダル開閉
  document.getElementById('btnOpenDocUpload').addEventListener('click', () => {
    document.getElementById('docFileInput').value = '';
    document.getElementById('docTitleInput').value = '';
    document.getElementById('selectedFileName').style.display = 'none';
    document.getElementById('selectedFileName').textContent = '';
    openModal('docUploadModal');
  });

  // ファイル選択 & ドラッグ＆ドロップ
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('docFileInput');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary)';
    dropZone.style.background = '#f0f9ff';
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#cbd5e1';
    dropZone.style.background = '#f8fafc';
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#cbd5e1';
    dropZone.style.background = '#f8fafc';
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  function handleFileSelected(file) {
    selectedUploadFile = file;
    const nameLabel = document.getElementById('selectedFileName');
    nameLabel.style.display = 'inline-block';
    nameLabel.textContent = `選択中: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    const titleInput = document.getElementById('docTitleInput');
    if (!titleInput.value) {
      // 拡張子を除いたファイル名をタイトル初期値に
      titleInput.value = file.name.replace(/\.[^/.]+$/, "");
    }
  }

  // ドキュメント登録実行
  document.getElementById('btnSubmitDocUpload').addEventListener('click', handleDocUpload);

  // 削除確定ボタン
  document.getElementById('btnConfirmDeleteDoc').addEventListener('click', executeDeleteDoc);

  // 一般ユーザー用マニュアル一覧ボタン
  document.getElementById('btnUserManuals').addEventListener('click', openUserManuals);
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

// ========== ドキュメント管理ロジック (新機能) ==========

// 1. 管理者: ドキュメント一覧ロード
async function loadDocuments() {
  const filterType = document.getElementById('docFilterType').value;
  const sortSetting = document.getElementById('docSortOrder').value;

  let sortKey = 'createdAt';
  let sortOrder = 'desc';

  if (sortSetting === 'date-asc') {
    sortKey = 'createdAt';
    sortOrder = 'asc';
  } else if (sortSetting === 'type-asc') {
    sortKey = 'type';
    sortOrder = 'asc';
  } else if (sortSetting === 'type-desc') {
    sortKey = 'type';
    sortOrder = 'desc';
  }

  let url = `/api/documents?sortKey=${sortKey}&sortOrder=${sortOrder}`;
  if (filterType !== 'all') {
    url += `&type=${filterType}`;
  }

  const res = await fetch(url);
  const docs = await res.json();
  const tbody = document.getElementById('documentsTableBody');
  tbody.innerHTML = '';

  if (docs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">登録されたドキュメントはありません</td></tr>`;
    return;
  }

  docs.forEach(doc => {
    const tr = document.createElement('tr');
    const isKnowledge = doc.type === 'knowledge';
    const typeBadge = isKnowledge
      ? `<span style="padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #e0f2fe; color: #0284c7;">💡 ナレッジ</span>`
      : `<span style="padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #fef3c7; color: #b45309;">📚 マニュアル</span>`;

    const formattedDate = new Date(doc.createdAt).toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });

    tr.innerHTML = `
      <td>
        <div style="font-weight: 600; color: #1e293b;">${escapeHtml(doc.title)}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(doc.originalFileName)} (${(doc.fileSize / 1024).toFixed(1)} KB)</div>
      </td>
      <td>${typeBadge}</td>
      <td style="font-size: 12px; color: var(--text-muted);">${formattedDate}</td>
      <td style="font-size: 12px;">${escapeHtml(doc.uploadedBy || '-')}</td>
      <td><span style="font-family: monospace; font-size: 12px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${doc.fileExtension || '-'}</span></td>
      <td style="text-align: center;">
        <button class="btn btn-sm btn-delete-doc" style="background: transparent; border: 1px solid #fecaca; color: #ef4444; padding: 4px 8px; border-radius: 4px; cursor: pointer;" title="削除">
          🗑️ 削除
        </button>
      </td>
    `;

    // 削除ボタンイベント
    tr.querySelector('.btn-delete-doc').addEventListener('click', (e) => {
      e.stopPropagation();
      confirmDeleteDoc(doc.id, doc.title);
    });

    tbody.appendChild(tr);
  });
}

// 2. ドキュメント登録送信
async function handleDocUpload() {
  if (!selectedUploadFile) {
    alert('ファイルを選択またはドラッグ＆ドロップしてください。');
    return;
  }

  const titleInput = document.getElementById('docTitleInput');
  const title = titleInput.value.trim();
  if (!title) {
    alert('ドキュメントタイトルを入力してください。');
    return;
  }

  const type = document.querySelector('input[name="docType"]:checked').value;

  const formData = new FormData();
  formData.append('file', selectedUploadFile);
  formData.append('title', title);
  formData.append('type', type);
  formData.append('user', JSON.stringify(currentUser));

  try {
    const res = await fetch('/api/documents', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error('アップロードに失敗しました');

    closeModal('docUploadModal');
    selectedUploadFile = null;
    titleInput.value = '';
    loadDocuments();
    alert('ドキュメントを正常に登録しました！');
  } catch (err) {
    alert(`エラー: ${err.message}`);
  }
}

// 3. 削除再確認モーダル表示
function confirmDeleteDoc(id, title) {
  deletingDocId = id;
  document.getElementById('deleteTargetDocTitle').textContent = `『${title}』`;
  openModal('docDeleteConfirmModal');
}

// 4. 削除確定処理
async function executeDeleteDoc() {
  if (!deletingDocId) return;

  try {
    const res = await fetch(`/api/documents/${deletingDocId}`, {
      method: 'DELETE'
    });

    if (!res.ok) throw new Error('削除に失敗しました');

    closeModal('docDeleteConfirmModal');
    deletingDocId = null;
    loadDocuments();
    alert('ドキュメントを削除しました。');
  } catch (err) {
    alert(`エラー: ${err.message}`);
  }
}

// 5. 一般ユーザー用: マニュアル一覧モーダル表示 & ダウンロード
async function openUserManuals() {
  const res = await fetch('/api/documents?type=manual');
  const manuals = await res.json();
  const tbody = document.getElementById('userManualTableBody');
  tbody.innerHTML = '';

  if (manuals.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">現在公開されているマニュアルはありません</td></tr>`;
  } else {
    manuals.forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="font-weight: 600; color: #1e293b;">${escapeHtml(m.title)}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(m.originalFileName)}</div>
        </td>
        <td><span style="font-family: monospace; font-size: 12px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${m.fileExtension}</span></td>
        <td style="font-size: 12px; color: var(--text-muted);">${(m.fileSize / 1024).toFixed(1)} KB</td>
        <td style="text-align: center;">
          <a href="/api/documents/${m.id}/download" class="btn btn-sm btn-primary" style="display: inline-block; text-decoration: none; padding: 4px 10px; font-size: 12px;" download>
            📥 DL
          </a>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  openModal('userManualModal');
}

// XSSサニタイズ
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
