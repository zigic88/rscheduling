const https = require('https');
// const fs = require('fs');
const PORT = 443;
const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3MzMwNjc2NzAyNTMsImVtYWlsIjoib2hkYW1uaXRzdG9ueUBvdXRsb29rLmNvbSIsImFjdGlvbiI6InRva2VuLWFwaSIsImFwaVZlcnNpb24iOiJ2MiIsImlhdCI6MTczMzA2NzY3MH0.teF5vKuH870DbErbrWWN6AMoeWgimukmV1ies3dm7p8';

const express = require('express');
const app = express();
const cron = require('node-cron');
const axios = require('axios');
const bodyParser = require('body-parser');
// const { Pool } = require('pg');

const TELEGRAM_TOKEN = '8075488644:AAGJPrLXNcVN7qtq-VPbQ_efjjM8m5-ZfH8';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const pool = require('./database/pool');
const { createOrAlterTable } = require('./create_alter_table');

//FOR PRODUCTION ***
// const sslOptions = require('./sslConfig');

// SSL options
// const sslOptions = {
//   key: fs.readFileSync('/opt/apps/ssl/server.key'),
//   cert: fs.readFileSync('/opt/apps/ssl/server.cert'),
// };

//Start HTTPS server
//FOR PRODUCTION ****
// https.createServer(sslOptions, app).listen(PORT, () => {
//   console.log(`Server running on https://your-server-ip:${PORT}`);
// });

//for Telegram
app.use(bodyParser.json());

// Endpoint to get GROUP_CHAT_ID from updates
app.get('/getGroupChatId', async (req, res) => {
  try {
    const response = await axios.get(`${TELEGRAM_API}/getUpdates`);
    const updates = response.data;

    if (updates.result.length > 0) {
      const chatId = updates.result[0].message.chat.id;
      res.json({ group_chat_id: chatId });
    } else {
      res.json({ message: 'No recent messages. Send a message in the group and try again.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve updates' });
  }
});

// Route to send message to Telegram chat with text and chat_id parameters
app.post('/api/sendMessage', async (req, res) => {
  const { chat_id, text } = req.body;
  if (!chat_id || !text) {
    return res.status(400).json({ success: false, error: 'Both chat_id and text parameters are required' });
  }

  try {
    const response = await axios.post(
      'https://api.telegram.org/bot8075488644:AAGJPrLXNcVN7qtq-VPbQ_efjjM8m5-ZfH8/sendMessage',
      {
        chat_id: chat_id,
        text: text
      }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook to listen for Telegram bot commands
// app.post('/webhook', async (req, res) => {
//   const { message } = req.body;
//   if (!message || !message.text) {
//     return res.sendStatus(400);
//   }

//   const chatId = message.chat.id;
//   const text = message.text.trim();
//   let reply = '';

//   // Handle different bot commands
//   switch (text) {
//     case '/start':
//       reply = 'Welcome to the bot! Use /help to see available commands.';
//       break;
//     case '/help':
//       reply = 'Available commands:\n/start - Start the bot\n/help - Show commands';
//       break;
//     default:
//       reply = `Unknown command: ${text}`;
//       break;
//   }

//   // Send response back to the user
//   try {
//     await axios.post(`${TELEGRAM_API}/sendMessage`, {
//       chat_id: chatId,
//       text: reply,
//     });
//   } catch (error) {
//     console.error('Error sending message:', error.message);
//   }

//   res.sendStatus(200);
// });

// // PostgreSQL connection settings
// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'postgres',
//   password: 'postgres',
//   port: 5432,
//   schema: 'tokenres'
// });

// Middleware to parse JSON
app.use(express.json());

// // Create or alter tbtoken table
// async function createOrAlterTable() {
//   try {
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS tokenres.tbtoken (
//         address VARCHAR(255) PRIMARY KEY,
//         created_date TIMESTAMP WITH TIME ZONE, 
//         created_time DECIMAL(10, 2),
//         decimals INTEGER,
//         name VARCHAR(255),
//         status VARCHAR(255),
//         symbol VARCHAR(255)
//       );
//     `);

//     await pool.query(`
//       ALTER TABLE tokenres.tbtoken
//       ADD COLUMN IF NOT EXISTS holders VARCHAR,
//       ADD COLUMN IF NOT EXISTS marketcap VARCHAR,
//       ADD COLUMN IF NOT EXISTS supply VARCHAR,
//       ADD COLUMN IF NOT EXISTS price VARCHAR,
//       ADD COLUMN IF NOT EXISTS volume_24h VARCHAR,
//       ADD COLUMN IF NOT EXISTS created_on VARCHAR,
//       ADD COLUMN IF NOT EXISTS freeze_authority VARCHAR;
//     `);

//     await pool.query(`
//       ALTER TABLE tokenres.tbtoken
//       ALTER COLUMN holders TYPE VARCHAR,
//       ALTER COLUMN marketcap TYPE VARCHAR,
//       ALTER COLUMN supply TYPE VARCHAR,
//       ALTER COLUMN price TYPE VARCHAR,
//       ALTER COLUMN volume_24h TYPE VARCHAR,
//       ALTER COLUMN created_on TYPE VARCHAR,
//       ALTER COLUMN freeze_authority TYPE VARCHAR;
//     `);

//     await pool.query(`
//       ALTER TABLE tokenres.tbtoken
//       ADD COLUMN IF NOT EXISTS metadata_name VARCHAR,
//       ADD COLUMN IF NOT EXISTS metadata_symbol VARCHAR,
//       ADD COLUMN IF NOT EXISTS metadata_image VARCHAR;
//     `);

//     console.log('tbtoken table created or altered successfully');
//   } catch (error) {
//     console.error('Error creating or altering tbtoken table:', error);
//   }
// }
// createOrAlterTable

// Initialize table creation or alteration
async function setupDatabase() {
  try {
    await createOrAlterTable();
    console.log('Database setup complete');
  } catch (error) {
    console.error('Database setup failed:', error);
  }
}

setupDatabase();

// Function to fetch and save data from the API
async function fetchAndSaveData(page) {
  try {
    console.log('Fetch from page: ' + page);
    const response = await axios.get(`https://pro-api.solscan.io/v2.0/token/list?sort_by=created_time&page=${page}&page_size=100`, {
      headers: {
        'token': API_TOKEN,
      },
    });

    const tokenList = response.data.data;

    if (!tokenList || tokenList.length === 0) {
      console.log(`No data returned for page ${page}`);
      return false; // No data returned
    }

    let tokenListNew = []; // Empty list to store filtered tokens

    for (const token of tokenList) {
      // Check if the address already exists in the database
      const checkQuery = {
        text: 'SELECT address FROM tokenres.tbtoken WHERE address = $1',
        values: [token.address],
      };

      const result = await pool.query(checkQuery);

      if (result.rows.length > 0) {
        console.log(`Address ${token.address} already exists. Skipping insert.`);
        continue;
      }

      //IF Token not End with pump and moon
      //then collect from API Metadata
      //check in notification settings
      if (!token.address.endsWith("pump") && !token.address.endsWith("moon")) {
        // Fetch additional details for the token from the secondary API
        const tokenMetaResponse = await axios.get(`https://pro-api.solscan.io/v2.0/token/meta?address=${token.address}`, {
          headers: {
            'token': API_TOKEN,
          },
        });

        const tokenMeta = tokenMetaResponse.data.data || {};

        // Extract metadata attributes safely
        const metadataImage = tokenMeta.metadata?.image || null;
        const metadataName = tokenMeta.metadata?.name || null;
        const metadataSymbol = tokenMeta.metadata?.symbol || null;
        const metadataDescription = tokenMeta.metadata?.description || null;

        // Insert new record, including only fields that are available
        const insertQuery = {
          text: `INSERT INTO tokenres.tbtoken (address, decimals, name, symbol, created_time, created_date, holders, marketcap, supply, price, volume_24h, created_on, freeze_authority, metadata_name, metadata_symbol, metadata_image, metadata_description) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          values: [
            token.address,
            token.decimals,
            token.name,
            token.symbol,
            token.created_time,
            new Date(token.created_time * 1000).toISOString(),
            tokenMeta.holder || '-',
            tokenMeta.market_cap || '-',
            tokenMeta.supply || '-',
            tokenMeta.price || '-',
            tokenMeta.volume_24h || '-',
            tokenMeta.metadata?.createdOn || '-',
            tokenMeta.freeze_authority || '-',
            metadataName, metadataSymbol, metadataImage, metadataDescription
          ].map(value => (value !== undefined ? value : null)),
        };

        await pool.query(insertQuery);

        tokenListNew.push(token);
      }
      console.log(`Address ${token.address} inserted successfully.`);
    }

    if (Array.isArray(tokenListNew) && tokenListNew.length > 0) {
      const query = `SELECT * FROM tokenres.tbnotification WHERE 1=1`;
      const queryParams = [];
      const queryResult = await pool.query(query, queryParams);
      const dynamicQueryParam = queryResult.rows[0].query_text;
      const dynamicQueryType = queryResult.rows[0].query_type;
      console.log("Dynamic Query Param:", dynamicQueryParam);
      console.log("Dynamic Query Type:", dynamicQueryType);

      let filteredTokens;
      if (dynamicQueryType === 'equals') {
        filteredTokens = filterTokensThatEquals(tokenListNew, dynamicQueryParam);
      } else {
        filteredTokens = filterTokensThatContains(tokenListNew, dynamicQueryParam);
      }

      // Filter tokens based on the dynamic parameter
      //const filteredTokens = filterTokens(tokenList, dynamicQueryParam);
      console.log("Filtered tokens:", filteredTokens);
      //Send Notification if meet requirements
      // Pass the filtered tokens to the sendMessageNotification method
      sendMessageNotification(filteredTokens);
    }

    return true; // Data fetched and processed successfully
  } catch (error) {
    console.error(`Error fetching or saving data from page ${page}:`, error);
    return false;
  }
}

//OLD ONE
function filterTokens(tokens, paramString) {
  // Parse the parameter string into an object of key-value pairs.
  const parameters = paramString.split("##").reduce((acc, pair) => {
    const [key, value] = pair.split("=");
    if (key && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

  // Filter tokens: each token must match all provided parameter key-value pairs.
  return tokens.filter(token =>
    Object.keys(parameters).every(key => token[key] === parameters[key])
  );
}

//EQUALS
function filterTokensThatEquals(tokens, filterString) {
  if (!filterString) return tokens;

  // Normalize the filter string and split into conditions
  let conditions = filterString.toLowerCase().split(/\s+(and|or)\s+/);
  let logicalOperators = [];

  // Extract logical operators separately
  let filters = conditions.filter((condition, index) => {
    if (condition === 'and' || condition === 'or') {
      logicalOperators.push(condition);
      return false;
    }
    return true;
  });

  return tokens.filter(token => {
    let results = filters.map(condition => {
      let [key, value] = condition.split('=').map(s => s.trim().replace(/['"]/g, ''));
      return token[key] && token[key].toLowerCase() === value.toLowerCase();
    });

    // Evaluate conditions with logical operators
    return results.reduce((acc, curr, index) => {
      if (logicalOperators[index - 1] === 'or') return acc || curr;
      if (logicalOperators[index - 1] === 'and') return acc && curr;
      return curr;
    }, results[0]);
  });
}

//CONTAINS
function filterTokensThatContains(tokens, filterString) {
  if (!filterString) return tokens;

  // Normalize the filter string and split into conditions
  let conditions = filterString.toLowerCase().split(/\s+(and|or)\s+/);
  let logicalOperators = [];

  // Extract logical operators separately
  let filters = conditions.filter((condition, index) => {
    if (condition === 'and' || condition === 'or') {
      logicalOperators.push(condition);
      return false;
    }
    return true;
  });

  return tokens.filter(token => {
    let results = filters.map(condition => {
      let [key, value] = condition.split('=').map(s => s.trim().replace(/['"]/g, ''));

      // Check if the token's field contains the value (case insensitive)
      return token[key] && token[key].toLowerCase().includes(value.toLowerCase());
    });

    // Evaluate conditions with logical operators
    return results.reduce((acc, curr, index) => {
      if (logicalOperators[index - 1] === 'or') return acc || curr;
      if (logicalOperators[index - 1] === 'and') return acc && curr;
      return curr;
    }, results[0]);
  });
}

/**
 * Function to send a notification for tokens that meet certain criteria.
 * @param {Array} tokens - Array of token objects that meet the dynamic parameters.
 */
async function sendMessageNotification(tokens) {
  for (const token of tokens) { // Use for..of for proper async handling
    // Construct the message with all tokens, each on a new line
    const textMessage = tokens.map(token =>
      `Token: ${token.name}\nAddress: ${token.address}\nSymbol: ${token.symbol}`
    ).join("\n\n"); // Separate each token with two new lines for readability
    console.log(textMessage);

    try {
      const response = await axios.post(
        'https://api.telegram.org/bot8075488644:AAGJPrLXNcVN7qtq-VPbQ_efjjM8m5-ZfH8/sendMessage',
        {
          chat_id: '-4623457838',
          text: textMessage
        }
      );
      console.log("Message sent successfully:", response.data);
    } catch (error) {
      console.error("Error sending message:", error.message);
    }
  }
}

// Cron job to fetch token data from Solscan API every 10 seconds
// PROD change cron to 10
// PROD change page to 15
cron.schedule('*/30 * * * * *', async () => { // Runs every 10 seconds
  console.log('Starting to fetch data from Solscan API...');

  for (let page = 1; page <= 2; page++) {
    console.log(`Fetching data for page ${page}...`);
    const success = await fetchAndSaveData(page);
    if (!success) break; // Stop if no data is returned
  }

  console.log('Data fetching completed.');
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// API endpoint to update metadata for filtered records
app.post('/api/update-metadata', async (req, res) => {
  const { addresses } = req.body;
  if (!addresses || !Array.isArray(addresses)) {
    return res.status(400).json({ message: 'Invalid addresses provided' });
  }

  try {
    for (const address of addresses) {
      // Fetch additional metadata for the token from the API
      const tokenMetaResponse = await axios.get(`https://pro-api.solscan.io/v2.0/token/meta?address=${address}`, {
        headers: {
          'token': API_TOKEN,
        },
      });

      const tokenMeta = tokenMetaResponse.data.data || {};
      // Extract metadata attributes safely
      const metadataImage = tokenMeta.metadata?.image || null;
      const metadataName = tokenMeta.metadata?.name || null;
      const metadataSymbol = tokenMeta.metadata?.symbol || null;
      const metadataDescription = tokenMeta.metadata?.description || null;

      // Update the metadata fields for the token
      const updateQuery = {
        text: `
          UPDATE tokenres.tbtoken
          SET 
            holders = $1,
            marketcap = $2,
            supply = $3,
            price = $4,
            volume_24h = $5,
            created_on = $6,
            freeze_authority = $7,
            metadata_name = $8, 
            metadata_symbol = $9, 
            metadata_image = $10,
            metadata_description = $11
          WHERE address = $12
        `,
        values: [
          tokenMeta.holder || '-',
          tokenMeta.market_cap || '-',
          tokenMeta.supply || '-',
          tokenMeta.price || '-',
          tokenMeta.volume_24h || '-',
          tokenMeta.metadata?.createdOn || '-',
          tokenMeta.freeze_authority || '-',
          metadataName,
          metadataSymbol,
          metadataImage,
          metadataDescription,
          address,
        ],
      };

      await pool.query(updateQuery);
      console.log(`Metadata updated for address: ${address}`);
    }

    res.json({ message: 'Metadata update completed successfully' });
  } catch (error) {
    console.error('Error updating metadata:', error);
    res.status(500).json({ message: 'Metadata update failed', error });
  }
});

// API endpoint to retrieve token list from PostgreSQL database
app.get('/api/tokens', async (req, res) => {
  try {
    let { page, limit, filter_type, name, symbol, address, decimals, created_date,
      holders, market_cap, supply, price, volume_24h,
      created_on, freeze_authority, metadata_name, metadata_symbol, metadata_image, metadata_description,
      excludePump, excludeMoon, createdOn, difMetadataName, difMetadataSymbol } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM tokenres.tbtoken WHERE 1=1`;
    let queryParams = [];
    let countQuery = `SELECT COUNT(*) FROM tokenres.tbtoken WHERE 1=1`;

    if (filter_type === 'equals') {
      if (name) {
        query += ` AND LOWER(name) = LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(name) = LOWER($${queryParams.length + 1})`;
        queryParams.push(`${name}`);
      }

      if (symbol) {
        query += ` AND LOWER(symbol) = LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(symbol) = LOWER($${queryParams.length + 1})`;
        queryParams.push(`${symbol}`);
      }

      if (address) {
        query += ` AND address = $${queryParams.length + 1}`;
        countQuery += ` AND address = $${queryParams.length + 1}`;
        queryParams.push(`${address}`);
      }

      if (decimals) {
        query += ` AND decimals = $${queryParams.length + 1}`;
        countQuery += ` AND decimals = $${queryParams.length + 1}`;
        queryParams.push(`${decimals}`);
      }

      if (created_date) {
        query += ` AND DATE(created_date) = $${queryParams.length + 1}`;
        countQuery += ` AND DATE(created_date) = $${queryParams.length + 1}`;
        queryParams.push(created_date);
      }

      if (holders) {
        query += ` AND LOWER(holders) = LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(holders) = LOWER($${queryParams.length + 1})`;
        queryParams.push(`${holders}`);
      }

      if (market_cap) {
        query += ` AND LOWER(market_cap) = LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(market_cap) = LOWER($${queryParams.length + 1})`;
        queryParams.push(`${market_cap}`);
      }

      if (supply) {
        query += ` AND LOWER(supply) = LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(supply) = LOWER($${queryParams.length + 1})`;
        queryParams.push(`${supply}`);
      }

      if (price) {
        query += ` AND LOWER(price) = LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(price) = LOWER($${queryParams.length + 1})`;
        queryParams.push(`${price}`);
      }

      if (volume_24h) {
        query += ` AND LOWER(volume_24h) = LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(volume_24h) = LOWER($${queryParams.length + 1})`;
        queryParams.push(`${volume_24h}`);
      }

      if (created_on) {
        query += ` AND LOWER(created_on) = LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(created_on) = LOWER($${queryParams.length + 1})`;
        queryParams.push(`${created_on}`);
      }

      if (freeze_authority) {
        query += ` AND LOWER(freeze_authority) = LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(freeze_authority) = LOWER($${queryParams.length + 1})`;
        queryParams.push(`${freeze_authority}`);
      }

      if (metadata_name) {
        query += ` AND LOWER(metadata_name) = LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(metadata_name) = LOWER($${queryParams.length + 1})`;
        queryParams.push(`${metadata_name}`);
      }

      if (metadata_symbol) {
        query += ` AND LOWER(metadata_symbol) = LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(metadata_symbol) = LOWER($${queryParams.length + 1})`;
        queryParams.push(`${metadata_symbol}`);
      }

      if (metadata_image) {
        query += ` AND LOWER(metadata_image) = LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(metadata_image) = LOWER($${queryParams.length + 1})`;
        queryParams.push(`${metadata_image}`);
      }

      if (metadata_description) {
        query += ` AND LOWER(metadata_description) = LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(metadata_description) = LOWER($${queryParams.length + 1})`;
        queryParams.push(`${metadata_description}`);
      }

    } else {
      if (name) {
        query += ` AND LOWER(name) LIKE LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(name) LIKE LOWER($${queryParams.length + 1})`;
        queryParams.push(`%${name}%`);
      }

      if (symbol) {
        query += ` AND LOWER(symbol) LIKE LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(symbol) LIKE LOWER($${queryParams.length + 1})`;
        queryParams.push(`%${symbol}%`);
      }

      if (address) {
        query += ` AND address LIKE $${queryParams.length + 1}`;
        countQuery += ` AND address LIKE $${queryParams.length + 1}`;
        queryParams.push(`%${address}%`);
      }

      if (decimals) {
        query += ` AND decimals = $${queryParams.length + 1}`;
        countQuery += ` AND decimals = $${queryParams.length + 1}`;
        queryParams.push(`${decimals}`);
      }

      if (created_date) {
        query += ` AND DATE(created_date) = $${queryParams.length + 1}`;
        countQuery += ` AND DATE(created_date) = $${queryParams.length + 1}`;
        queryParams.push(created_date);
      }

      if (holders) {
        query += ` AND LOWER(holders) LIKE LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(holders) LIKE LOWER($${queryParams.length + 1})`;
        queryParams.push(`%${holders}%`);
      }

      if (market_cap) {
        query += ` AND LOWER(market_cap) LIKE LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(market_cap) LIKE LOWER($${queryParams.length + 1})`;
        queryParams.push(`%${market_cap}%`);
      }

      if (supply) {
        query += ` AND LOWER(supply) LIKE LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(supply) LIKE LOWER($${queryParams.length + 1})`;
        queryParams.push(`%${supply}%`);
      }

      if (price) {
        query += ` AND LOWER(price) LIKE LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(price) LIKE LOWER($${queryParams.length + 1})`;
        queryParams.push(`%${price}%`);
      }

      if (volume_24h) {
        query += ` AND LOWER(volume_24h) LIKE LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(volume_24h) LIKE LOWER($${queryParams.length + 1})`;
        queryParams.push(`%${volume_24h}%`);
      }

      if (created_on) {
        query += ` AND LOWER(created_on) LIKE LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(created_on) LIKE LOWER($${queryParams.length + 1})`;
        queryParams.push(`%${created_on}%`);
      }

      if (freeze_authority) {
        query += ` AND LOWER(freeze_authority) LIKE LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(freeze_authority) LIKE LOWER($${queryParams.length + 1})`;
        queryParams.push(`%${freeze_authority}%`);
      }

      if (metadata_name) {
        query += ` AND LOWER(metadata_name) LIKE LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(metadata_name) LIKE LOWER($${queryParams.length + 1})`;
        queryParams.push(`%${metadata_name}%`);
      }

      if (metadata_symbol) {
        query += ` AND LOWER(metadata_symbol) LIKE LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(metadata_symbol) LIKE LOWER($${queryParams.length + 1})`;
        queryParams.push(`%${metadata_symbol}%`);
      }

      if (metadata_image) {
        query += ` AND LOWER(metadata_image) LIKE LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(metadata_image) LIKE LOWER($${queryParams.length + 1})`;
        queryParams.push(`%${metadata_image}%`);
      }

      if (metadata_description) {
        query += ` AND LOWER(metadata_description) LIKE LOWER($${queryParams.length + 1})`;
        countQuery += ` AND LOWER(metadata_description) LIKE LOWER($${queryParams.length + 1})`;
        queryParams.push(`%${metadata_description}%`);
      }
    }

    if (excludePump === 'true') {
      console.log('excludePump is true');
      query += ` AND LOWER(address) NOT ILIKE LOWER($${queryParams.length + 1})`;
      countQuery += ` AND LOWER(address) NOT ILIKE LOWER($${queryParams.length + 1})`;
      queryParams.push(`%pump`);
    }

    if (excludeMoon === 'true') {
      console.log('excludeMoon is true');
      query += ` AND LOWER(address) NOT ILIKE LOWER($${queryParams.length + 1})`;
      countQuery += ` AND LOWER(address) NOT ILIKE LOWER($${queryParams.length + 1})`;
      queryParams.push(`%moon`);
    }

    if (createdOn === 'true') {
      console.log('createdOn is true');
      query += ` AND LOWER(created_on) = LOWER($${queryParams.length + 1})`;
      countQuery += ` AND LOWER(created_on) = LOWER($${queryParams.length + 1})`;
      queryParams.push(`https://pump.fun`);
    } else {
      console.log('createdOn is false');
      query += ` AND LOWER(created_on) NOT ILIKE LOWER($${queryParams.length + 1})`;
      countQuery += ` AND LOWER(created_on) NOT ILIKE LOWER($${queryParams.length + 1})`;
      queryParams.push(`https://pump.fun`);
    }

    if (difMetadataName === 'true') {
      console.log('difMetadataName is true');
      query += ` AND LOWER(name) <> LOWER(metadata_name)`;
      countQuery += ` AND LOWER(name) <> LOWER(metadata_name)`;
    }

    if (difMetadataSymbol === 'true') {
      console.log('difMetadataSymbol is true');
      query += ` AND LOWER(symbol) <> LOWER(metadata_symbol)`;
      countQuery += ` AND LOWER(symbol) <> LOWER(metadata_symbol)`;
    }


    query += ` ORDER BY created_date DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await pool.query(query, queryParams);
    const totalCount = await pool.query(countQuery, queryParams);

    res.json({
      total: totalCount.rows[0].count,
      page,
      limit,
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching tokens:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// app.get('/api/bot/notifications', async (req, res) => {
//   try {
//     let query = `SELECT * FROM tokenres.tbnotification WHERE 1=1`;
//     let queryParams = [];
//     const result = await pool.query(query, queryParams);
//     res.json(result.rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error retrieving notifications list' });
//   }
// });

//Get List Of Notifications
app.get('/api/bot/notifications', async (req, res) => {
  try {
    let query = `SELECT * FROM tokenres.tbnotification WHERE 1=1`;
    let queryParams = [];
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving notifications list' });
  }
});

//Init Notififications
app.post('/api/bot/init-notification', async (req, res) => {
  try {
    const query = {
      text: `INSERT INTO tokenres.tbnotification (notif_name, description, group_id, query_text, created_date) VALUES 
      ($1, $2, $3, $4, $5)`,
      values: [
        'TOKEN_SNAP', 'TOKEN SNAP NOTIFICATIONS', '-4623457838', 'address=1231212', new Date().toISOString()
      ],
    }

    await pool.query(query);
    res.json({ message: 'Init data completed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving notifications list' });
  }
});

//Update Notififications
app.post('/api/bot/update-notification', async (req, res) => {
  try {
    const { notif_name, description, group_id, query_text, query_type } = req.body;
    // Validate required field
    if (!notif_name) {
      return res.status(400).json({ message: 'notif_name is required' });
    }

    // Create an object of fields and remove empty values
    const fields = {
      description,
      group_id,
      query_text,
      query_type,
      update_date: new Date().toISOString(),
    };

    // Filter out empty values
    const filteredFields = Object.fromEntries(
      Object.entries(fields).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );

    // Build SET clause dynamically
    const setClauses = Object.keys(filteredFields).map(
      (key, index) => `${key}=$${index + 2}`
    ).join(', ');


    // Construct query
    const query = {
      text: `UPDATE tokenres.tbnotification SET ${setClauses} WHERE notif_name=$1`,
      values: [notif_name, ...Object.values(filteredFields)],
    };

    // Execute query
    const result = await pool.query(query);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No record found with the provided notif_name' });
    }

    res.json({ message: 'Notification updated successfully' });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});
