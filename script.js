// DOM要素の取得
const loginPage = document.getElementById('login-page');
const mainPage = document.getElementById('main-page');
const spacePage = document.getElementById('space-page');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const publicChat = document.getElementById('public-chat');
const spaceChat = document.getElementById('space-chat');
const newSpaceModal = document.getElementById('new-space-modal');

// 現在のユーザーと現在のスペース
let currentUser = null;
let currentSpace = null;

// ページ切り替え関数
function showPage(page) {
    [loginPage, mainPage, spacePage].forEach(p => p.classList.add('hidden'));
    page.classList.remove('hidden');
}

// 新規登録とログインの表示切り替え
document.getElementById('show-signup').addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
});

document.getElementById('show-login').addEventListener('click', () => {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// 新規登録処理
document.getElementById('signup-button').addEventListener('click', (e) => {
    e.preventDefault();
    const nickname = document.getElementById('signup-nickname').value;
    const id = document.getElementById('signup-id').value;
    const password = document.getElementById('signup-password').value;

    if (nickname && id && password && id.length === 5 && !isNaN(id)) {
        localStorage.setItem(id, JSON.stringify({ nickname, password }));
        alert('アカウントが作成されました。ログインしてください。');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        alert('入力内容を確認してください。識別コードは5桁の数字である必要があります。');
    }
});

// ログイン処理
document.getElementById('login-button').addEventListener('click', (e) => {
    e.preventDefault();
    const id = document.getElementById('login-id').value;
    const password = document.getElementById('login-password').value;

    const userData = JSON.parse(localStorage.getItem(id));
    if (userData && userData.password === password) {
        currentUser = { id, nickname: userData.nickname };
        showPage(mainPage);
        loadPublicChat();
        updateActiveSpaces();
    } else {
        alert('ログインに失敗しました。');
    }
});

// ログアウト処理
document.getElementById('logout').addEventListener('click', () => {
    currentUser = null;
    currentSpace = null;
    showPage(loginPage);
});

// 新規スペース作成モーダル表示
document.getElementById('new-space-btn').addEventListener('click', () => {
    newSpaceModal.classList.remove('hidden');
});

// 新規スペース作成処理
document.getElementById('create-space-btn').addEventListener('click', () => {
    const spaceName = document.getElementById('space-name-input').value;
    const memberIds = document.getElementById('member-id-input').value.split(',').map(id => id.trim());
    
    if (spaceName && memberIds.length > 0) {
        createNewSpace(spaceName, memberIds);
        newSpaceModal.classList.add('hidden');
    } else {
        alert('スペース名とメンバーの識別コードを入力してください。');
    }
});

// モーダルを閉じる
document.getElementById('close-modal-btn').addEventListener('click', () => {
    newSpaceModal.classList.add('hidden');
});

// 新規スペース作成関数
function createNewSpace(name, memberIds) {
    const spaceId = Date.now().toString();
    const space = {
        id: spaceId,
        name: name,
        members: [currentUser.id, ...memberIds],
        messages: []
    };
    let spaces = JSON.parse(localStorage.getItem('spaces')) || {};
    spaces[spaceId] = space;
    localStorage.setItem('spaces', JSON.stringify(spaces));
    updateActiveSpaces();
    openSpace(spaceId);
}

// アクティブなスペース一覧を更新
function updateActiveSpaces() {
    const activeSpacesContainer = document.getElementById('active-spaces');
    activeSpacesContainer.innerHTML = '';
    const spaces = JSON.parse(localStorage.getItem('spaces')) || {};
    Object.values(spaces).forEach(space => {
        if (space.members.includes(currentUser.id)) {
            const spaceElement = document.createElement('div');
            spaceElement.classList.add('space-item');
            spaceElement.textContent = space.name;
            spaceElement.addEventListener('click', () => openSpace(space.id));
            activeSpacesContainer.appendChild(spaceElement);
        }
    });
}

// スペースを開く
function openSpace(spaceId) {
    const spaces = JSON.parse(localStorage.getItem('spaces')) || {};
    currentSpace = spaces[spaceId];
    document.getElementById('space-name').textContent = currentSpace.name;
    showPage(spacePage);
    loadSpaceChat();
}

// 公開チャットへ戻る
document.getElementById('back-to-public').addEventListener('click', () => {
    currentSpace = null;
    showPage(mainPage);
    loadPublicChat();
});

// メンバー追加
document.getElementById('add-member').addEventListener('click', () => {
    const newMemberId = prompt('新しいメンバーの識別コードを入力してください：');
    if (newMemberId && !currentSpace.members.includes(newMemberId)) {
        currentSpace.members.push(newMemberId);
        let spaces = JSON.parse(localStorage.getItem('spaces'));
        spaces[currentSpace.id] = currentSpace;
        localStorage.setItem('spaces', JSON.stringify(spaces));
        alert('メンバーが追加されました。');
    } else if (currentSpace.members.includes(newMemberId)) {
        alert('このメンバーは既に追加されています。');
    }
});

// 公開チャットの読み込み
function loadPublicChat() {
    const publicMessages = JSON.parse(localStorage.getItem('publicMessages')) || [];
    displayMessages(publicMessages, 'messages');
}

// スペースチャットの読み込み
function loadSpaceChat() {
    displayMessages(currentSpace.messages, 'space-messages');
}

// メッセージの表示
function displayMessages(messages, elementId) {
    const messageArea = document.getElementById(elementId);
    messageArea.innerHTML = '';
    messages.forEach(msg => {
        const messageElement = document.createElement('p');
        messageElement.textContent = `${msg.time} ${msg.user}: ${msg.text}`;
        messageArea.appendChild(messageElement);
    });
    messageArea.scrollTop = messageArea.scrollHeight;
}

// 公開チャットへのメッセージ送信
document.getElementById('message-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('message-input');
    if (input.value) {
        addMessage(input.value, 'publicMessages');
        input.value = '';
    }
});

// スペースチャットへのメッセージ送信
document.getElementById('space-message-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('space-message-input');
    if (input.value) {
        addMessage(input.value, 'spaceMessages');
        input.value = '';
    }
});

// メッセージの追加
function addMessage(text, type) {
    const timestamp = new Date().toLocaleTimeString();
    const message = { user: currentUser.nickname, text, time: timestamp };
    
    if (type === 'publicMessages') {
        let publicMessages = JSON.parse(localStorage.getItem('publicMessages')) || [];
        publicMessages.push(message);
        localStorage.setItem('publicMessages', JSON.stringify(publicMessages));
        loadPublicChat();
    } else if (type === 'spaceMessages') {
        currentSpace.messages.push(message);
        let spaces = JSON.parse(localStorage.getItem('spaces'));
        spaces[currentSpace.id] = currentSpace;
        localStorage.setItem('spaces', JSON.stringify(spaces));
        loadSpaceChat();
    }
}
