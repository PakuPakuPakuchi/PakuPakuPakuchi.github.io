const WebSocket = require('ws');
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

wss.on('connection', (ws) => {
    console.log('クライアントが接続しました');

    ws.on('message', (message) => {
        console.log('受信したメッセージ:', message);
        const data = JSON.parse(message);

        if (data.type === 'chat') {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    if (data.isPublic || (data.spaceId && client.spaceId === data.spaceId)) {
                        client.send(JSON.stringify(data));
                    }
                }
            });
        } else if (data.type === 'login') {
            ws.userId = data.userId;
            ws.nickname = data.nickname;
            console.log(`ユーザーがログインしました: ${data.nickname}`);
        }
    });

    ws.on('close', () => {
        console.log('クライアントが切断しました');
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`サーバーがポート ${PORT} で起動しました`);
});
