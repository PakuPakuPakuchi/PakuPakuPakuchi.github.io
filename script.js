let currentUser = null;
let currentSpace = null;
let socket = null;

const loginPage = document.getElementById('login-page');
const signupPage = document.getElementById('signup-page');
const mainPage = document.getElementById('main-page');
const spacePage = document.getElementById('space-page');
const newSpaceModal = document.getElementById('new-space-modal');
const closeModalButton = document.getElementById('close-modal');
const newSpaceForm = document.getElementById('new-space-form');

function showPage(page) {
    [loginPage, signupPage, mainPage, spacePage].forEach(p => p.classList.add('hidden'));
    page.classList.remove('hidden');
}

function connectWebSocket() {
    socket = new WebSocket('ws://192.168.1.10:3180');

    socket.onopen = () => {
        console.log('WebSocket接続が確立されました');
        if (currentUser) {
            socket.send(JSON.stringify({
                type: 'login',
                userId: currentUser.id,
                nickname: currentUser.nickname
            }));
        }
    };

    socket.onmessage = (event) => {
        console.log('メッセージを受信しました:', event.data);
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
            addMessageToChat(data.message, data.user, data.isPublic ? 'messages' : 'space-messages');
        }
    };

    socket.onerror = (event) => {
        console.error('WebSocketエラー:', event);
    };

    socket.onclose = () => {
        console.log('WebSocket接続が閉じられました');
        setTimeout(connectWebSocket, 5000);
    };
}

function addMessageToChat(message, user, containerId) {
    const container = document.getElementById(containerId);
    const messageElement = document.createElement('p');
    messageElement.textContent = `${user}: ${message}`;
    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight;
}

function sendMessage(message, isPublic) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const messageData = {
            type: 'chat',
            message: message,
            user: currentUser.nickname,
            isPublic: isPublic,
            spaceId: isPublic ? null : currentSpace.id
        };
        console.log('メッセージを送信します:', messageData);
        socket.send(JSON.stringify(messageData));
        addMessageToChat(message, currentUser.nickname, isPublic ? 'messages' : 'space-messages');
    } else {
        console.error('WebSocket接続が確立されていません');
        connectWebSocket();
    }
}

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('login-id').value;
    const password = document.getElementById('login-password').value;
    const userData = JSON.parse(localStorage.getItem(id));
    if (userData && userData.password === password) {
        currentUser = { id, nickname: userData.nickname };
        showPage(mainPage);
        connectWebSocket();
    } else {
        alert('ログインに失敗しました');
    }
});

document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nickname = document.getElementById('signup-nickname').value;
    const id = document.getElementById('signup-id').value;
    const password = document.getElementById('signup-password').value;
    if (id.length === 5 && !isNaN(id)) {
        localStorage.setItem(id, JSON.stringify({ nickname, password }));
        alert('アカウントが作成されました');
        showPage(loginPage);
    } else {
        alert('識別コードは5桁の数字である必要があります');
    }
});

document.getElementById('show-signup').addEventListener('click', () => showPage(signupPage));
document.getElementById('show-login').addEventListener('click', () => showPage(loginPage));

document.getElementById('message-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (message) {
        console.log('公開チャットにメッセージを送信します:', message);
        sendMessage(message, true);
        messageInput.value = '';
    }
});

document.getElementById('logout').addEventListener('click', () => {
    currentUser = null;
    currentSpace = null;
    if (socket) socket.close();
    showPage(loginPage);
});

document.getElementById('new-space').addEventListener('click', () => {
    newSpaceModal.classList.remove('hidden');
});

closeModalButton.addEventListener('click', () => {
    newSpaceModal.classList.add('hidden');
});

newSpaceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const spaceName = document.getElementById('space-name-input').value.trim();
    const memberIds = document.getElementById('member-ids').value.split(',').map(id => id.trim());
    if (spaceName && memberIds.length > 0) {
        const spaceId = Date.now().toString();
        const space = { id: spaceId, name: spaceName, members: [currentUser.id, ...memberIds], messages: [] };
        let spaces = JSON.parse(localStorage.getItem('spaces')) || {};
        spaces[spaceId] = space;
        localStorage.setItem('spaces', JSON.stringify(spaces));
        newSpaceModal.classList.add('hidden');
        openSpace(spaceId);
    } else {
        alert('スペース名とメンバーの識別コードを入力してください');
    }
});

function openSpace(spaceId) {
    const spaces = JSON.parse(localStorage.getItem('spaces')) || {};
    currentSpace = spaces[spaceId];
    document.getElementById('space-name').textContent = currentSpace.name;
    showPage(spacePage);
    displaySpaceMessages();
}

function displaySpaceMessages() {
    const container = document.getElementById('space-messages');
    container.innerHTML = '';
    currentSpace.messages.forEach(msg => {
        addMessageToChat(msg.text, msg.user, 'space-messages');
    });
}

document.getElementById('space-message-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const messageInput = document.getElementById('space-message-input');
    const message = messageInput.value.trim();
    if (message) {
        console.log('スペースチャットにメッセージを送信します:', message);
        sendMessage(message, false);
        currentSpace.messages.push({ text: message, user: currentUser.nickname });
        let spaces = JSON.parse(localStorage.getItem('spaces'));
        spaces[currentSpace.id] = currentSpace;
        localStorage.setItem('spaces', JSON.stringify(spaces));
        messageInput.value = '';
    }
});

document.getElementById('back-to-public').addEventListener('click', () => {
    currentSpace = null;
    showPage(mainPage);
});

showPage(loginPage);
