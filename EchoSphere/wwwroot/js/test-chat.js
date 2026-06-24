let connection = null;
let isConnected = false;
let token = null;
(function init() {
    const saved = localStorage.getItem('echosphere.token');
    if (saved) {
        token = saved;
        document.getElementById('rememberToken').checked = true;
        const su = localStorage.getItem('echosphere.userId');
        if (su) document.getElementById('userIdDisplay').textContent = su;
        addLog('\uD83D\uDD12 Loaded saved token');
    }

    const chatControls = document.getElementById('chatControls');
    if (chatControls) chatControls.classList.add('d-none');

    const roomControls = document.getElementById('roomControls');
    if (roomControls) roomControls.classList.add('d-none');

    const sendBtn = document.getElementById('sendRoomBtn');
    if (sendBtn) sendBtn.disabled = true;

    const roomSelect = document.getElementById('roomSelect');
    if (roomSelect) {
        roomSelect.addEventListener('change', () => {
            const joinBtnTop = document.getElementById('joinRoomTop');
            if (joinBtnTop) { joinBtnTop.disabled = false; joinBtnTop.textContent = 'Join Room'; }
            const joinBtn = document.querySelector('button[onclick="joinRoom()"]');
            if (joinBtn) { joinBtn.disabled = false; joinBtn.textContent = 'Join Room'; }
            if (chatControls) chatControls.classList.add('d-none');
            if (roomControls) roomControls.classList.add('d-none');
            const currentRoom = document.getElementById('currentRoom');
            if (currentRoom) currentRoom.textContent = '-';
            if (sendBtn) sendBtn.disabled = true;
        });
    }
})();

function addLog(text) {
    const log = document.getElementById('log');
    const line = document.createElement('div');
    line.style.padding = '6px 0';
    line.innerHTML = text;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
}

async function login() {
    const username = document.getElementById('usernameInput').value.trim();
    if (!username) { alert('Digite um username'); return; }
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        token = data.token;
        document.getElementById('userIdDisplay').textContent = data.userId;
        addLog('✅ Login succeeded — token received');
        const rememberEl = document.getElementById('rememberToken');

        if (rememberEl && rememberEl.checked) {
            localStorage.setItem('echosphere.token', data.token);
            localStorage.setItem('echosphere.userId', data.userId);
            localStorage.setItem('echosphere.username', data.username);
            addLog('\uD83D\uDD12 Token saved locally');
        }

        await connect();
    } catch (err) {
        addLog('❌ Login error: ' + err);
        console.error(err);
    }
}

function copyToken() {
    const t = token || localStorage.getItem('echosphere.token');
    if (!t) return addLog('No token to copy');
    navigator.clipboard?.writeText(t).then(() => addLog('Token copied'));
}

async function connect() {
    if (!token) {
        const saved = localStorage.getItem('echosphere.token');
        if (saved) token = saved;
    }
    if (!token) return addLog('❌ No token available. Please login first.');
    if (isConnected) return addLog('Already connected');

    connection = new signalR.HubConnectionBuilder()
        .withUrl(`${window.location.protocol}//${window.location.host}/echosphereHub`, { accessTokenFactory: () => token })
        .withAutomaticReconnect()
        .build();

    connection.on('ReceiveMessage', (msg) => {
        const sender = msg.senderUsername || msg.SenderUsername || msg.sender || 'unknown';
        const content = msg.content || msg.Content || '';
        addLog(`📨 ${sender}: ${content}`);
    });

    connection.on('ReceivePrivateMessage', (msg) => {
        const sender = msg.senderUsername || msg.SenderUsername || msg.sender || 'unknown';
        const content = msg.content || msg.Content || '';
        addLog(`🔐 Private from ${sender}: ${content}`);
    });

    connection.on('UserConnected', (username) => addLog(`👤 ${username} connected`));
    connection.on('UserJoined', (username, roomId) => addLog(`👥 ${username} joined ${roomId}`));
    connection.on('UserDisconnected', (userId) => addLog(`🚫 user disconnected: ${userId}`));

    connection.onclose(() => { isConnected = false; addLog('⚠️ Disconnected from hub'); });

    try {
        await connection.start();
        isConnected = true;
        addLog('✅ Connected to EchoSphere Hub');
        const saved = localStorage.getItem('echosphere.token');
        if (saved) {
            document.getElementById('rememberToken').checked = true;
            const su = localStorage.getItem('echosphere.userId');
            if (su) document.getElementById('userIdDisplay').textContent = su;
        }
    } catch (err) { addLog('❌ Connection failed: ' + err); console.error(err); }
}

function clearSavedToken() {
    localStorage.removeItem('echosphere.token');
    localStorage.removeItem('echosphere.userId');
    localStorage.removeItem('echosphere.username');
    addLog('⚪ Saved token cleared');
}

async function joinRoom() {
    if (!connection) return addLog('❌ Connect first!');
    const roomId = document.getElementById('roomSelect').value;
    if (!roomId) return addLog('❌ Provide a room id');
    await connection.invoke('JoinRoom', roomId);
    addLog(`Joined room ${roomId}`);
    const chatControls = document.getElementById('chatControls');
    if (chatControls) chatControls.style.display = 'block';
    const roomControls = document.getElementById('roomControls');
    if (roomControls) roomControls.style.display = 'block';
    const currentRoom = document.getElementById('currentRoom');
    const sel = document.getElementById('roomSelect');
    const displayName = sel?.selectedOptions?.[0]?.text || roomId;
    if (currentRoom) currentRoom.textContent = displayName;
    const joinBtn = document.querySelector('button[onclick="joinRoom()"]');
    if (joinBtn) { joinBtn.disabled = true; joinBtn.textContent = 'Joined'; }
    const sendBtn = document.getElementById('sendRoomBtn');
    if (sendBtn) sendBtn.disabled = false;
}

async function sendMessage() {
    if (!connection) return addLog('❌ Connect first!');
    const roomId = document.getElementById('roomSelect').value || 'sala-geral';
    const content = document.getElementById('roomMessageInput').value.trim();
    if (!content) return addLog('❌ Type a message');
    await connection.invoke('SendMessage', { roomId, content });
    const sel = document.getElementById('roomSelect');
    const displayName = sel?.selectedOptions?.[0]?.text || roomId;
    addLog(`Message sent to ${displayName}`);
    document.getElementById('roomMessageInput').value = '';
}

async function sendPrivateMessage() {
    if (!connection) return addLog('❌ Connect first!');
    const toUserId = document.getElementById('toUserIdInput').value.trim();
    const content = document.getElementById('privateMessageInput').value.trim();
    if (!toUserId || !content) return addLog('❌ Provide toUserId and message');
    await connection.invoke('SendPrivateMessage', { toUserId, content });
    addLog(`Private message sent to ${toUserId}`);
    document.getElementById('privateMessageInput').value = '';
}