require('dotenv').config(); // Load .env at the top
const https = require('https');
// const fs = require('fs');
// const PORT = 443;

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
const axios = require('axios');

// const cert = fs.readFileSync('/opt/apps/ssl/server.cert'); // Load the self-signed certificate
// const agent = new https.Agent({ ca: cert });
const agent = new https.Agent({ rejectUnauthorized: false });

// const TELEGRAM_BOT_TOKEN = '8075488644:AAGJPrLXNcVN7qtq-VPbQ_efjjM8m5-ZfH8'; // Replace with your own bot token
// const GROUP_CHAT_ID = '-4623457838';

const API_TELEGRAM_BOT_QUERY_ENDPOINT = process.env.REACT_APP_API_TELEGRAM_BOT_QUERY_ENDPOINT || 'https://139.180.184.90/api/bot/notifications';
const API_TELEGRAM_BOT_UPDATE_NOTIFICATION_ENDPOINT = process.env.REACT_APP_API_TELEGRAM_BOT_UPDATE_NOTIFICATION_ENDPOINT || 'https://139.180.184.90/api/bot/update-notifications';

const TELEGRAM_BOT_TOKEN = process.env.REACT_APP_TELEGRAM_BOT_TOKEN || '8075488644:AAGJPrLXNcVN7qtq-VPbQ_efjjM8m5-ZfH8';
const GROUP_CHAT_ID = process.env.REACT_APP_TELEGRAM_GROUP_CHAT_ID || '-4796647550';

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// const sslOptions = require('./sslConfig');

// SSL options
// const sslOptions = {
//   key: fs.readFileSync('/opt/apps/ssl/server.key'),
//   cert: fs.readFileSync('/opt/apps/ssl/server.cert'),
// };

//Start HTTPS server
// https.createServer(sslOptions, app).listen(PORT, () => {
//   console.log(`Server running on https://your-server-ip:${PORT}`);
// });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    if (messageText === '/start') {
        bot.sendMessage(chatId, 'Welcome to the bot!');
    } else if (messageText === '/door') {
        bot.sendMessage(chatId, 'Bot Duuaaaaarrrrr!');
    } else if (messageText === '/qparam') {
        const result = await retrieveQueryParam();
        bot.sendMessage(chatId, `Current Query Param: ${result}`);
    } else if (messageText.startsWith('/cparam')) {
        bot.sendMessage(chatId, 'Command for change query param');
    } else {
        bot.sendMessage(chatId, 'Command not found. Please contact administrator..');
    }
});

// Echo command with parameter
bot.onText(/^\/echo (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    let param = match[1].trim(); // Extract the matched text after '/price'
    // Remove single or double quotes if present
    param = param.replace(/^['"]+|['"]+$/g, '');
    if (!param) {
        bot.sendMessage(chatId, "Please provide a valid token symbol. Example: /price abc");
        return;
    }

    bot.sendMessage(chatId, `You said: ${param}`);
});

// bot.onText(/^\/price (\w+)/, (msg, match) => {
bot.onText(/^\/price\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    let param = match[1].trim(); // Extract the matched text after '/price'
    // Remove single or double quotes if present
    param = param.replace(/^['"]+|['"]+$/g, '');
    if (!param) {
        bot.sendMessage(chatId, "Please provide a valid token symbol. Example: /price abc");
        return;
    }

    bot.sendMessage(chatId, `Fetching price for ${param}`);
    // You can add API logic here to get real prices (e.g., from CoinGecko or Binance)
});

bot.onText(/^\/cparam\s+(.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    let param = match[1].trim(); // Extract the matched text after '/cparam'
    // Remove single or double quotes if present
    param = param.replace(/^['"]+|['"]+$/g, '');
    if (!param) {
        bot.sendMessage(chatId, "Please provide a valid cparam. Example: /cparam 'query_text##query_type'");
        return;
    }
    const parts = param.split('##');
    if (parts.length < 2) {
        bot.sendMessage(chatId, "Please provide a valid cparam. Example: /cparam 'query_text##query_type'");
        return;
    }
    const query_param = parts[0];
    const query_type = parts[1];
    const result = changeQueryParam(query_param, query_type);
    bot.sendMessage(chatId, `\nUpdated Query\n==========================\nChange Query Param to ${query_param}.\nQuery type to ${query_type}`);
});

async function sendBotResponse(tokens) {
    console.log('sendBotResponse');
}

async function retrieveQueryParam() {
    console.log('retrieveQueryParam');
    try {
        const urls = `${API_TELEGRAM_BOT_QUERY_ENDPOINT}`;
        console.log(urls);
        const response = await axios.get(urls, { httpsAgent: agent });
        const data = response.data;
        console.log("Query Param:", response.data);

        if (Array.isArray(data) && data.length > 0) {
            const tokenItem = data[0];
            const textMessage =
                `\n==========================\nQuery Name: ${tokenItem.notif_name}\nQuery Text: ${tokenItem.query_text}\nQuery Type: ${tokenItem.query_type}`;
            console.log(textMessage)
            return textMessage;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error sending message:", error.message);
        return null;
    }
}

async function changeQueryParam(queryText, queryType) {
    console.log('changeQueryParam() queryText: ' + queryText);
    console.log('changeQueryParam() queryType: ' + queryType);
    try {
        const urls = `${API_TELEGRAM_BOT_UPDATE_NOTIFICATION_ENDPOINT}`;
        console.log(urls);

        const notifName = 'TOKEN_SNAP';
        const description = 'TOKEN SNAP NOTIFICATIONS';

        const requestData = {
            notif_name: notifName,
            group_id: GROUP_CHAT_ID,
            query_text: queryText,
            query_type: queryType,
            description: description
        };

        const response = await axios.post(urls, requestData, {
            headers: {
                'Content-Type': 'application/json'
            },            
            httpsAgent: agent 
        });
        const data = response.data;
        console.log("Query Param:", data);

        const textMessage =
            `\nUpdated Query==========================\nQuery Name: ${notifName}\nQuery Text: ${queryText}\nQuery Type: ${queryType}`;
        console.log(textMessage);
        return textMessage;
    } catch (error) {
        console.error("Error sending message:", error.message);
        return null;
    }
}

app.listen(3002, () => {
    console.log('Server listening on port 3002');
});