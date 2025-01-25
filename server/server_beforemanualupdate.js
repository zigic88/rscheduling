const https = require('https');
const fs = require('fs');
const PORT = 443;
const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3MzMwNjc2NzAyNTMsImVtYWlsIjoib2hkYW1uaXRzdG9ueUBvdXRsb29rLmNvbSIsImFjdGlvbiI6InRva2VuLWFwaSIsImFwaVZlcnNpb24iOiJ2MiIsImlhdCI6MTczMzA2NzY3MH0.teF5vKuH870DbErbrWWN6AMoeWgimukmV1ies3dm7p8';

const express = require('express');
const app = express();
const cron = require('node-cron');
const axios = require('axios');
const { Pool } = require('pg');

// SSL options
// const sslOptions = {
//   key: fs.readFileSync('/opt/apps/ssl/server.key'),
//   cert: fs.readFileSync('/opt/apps/ssl/server.cert'),
// };

// Start HTTPS server
// https.createServer(sslOptions, app).listen(PORT, () => {
//   console.log(`Server running on https://your-server-ip:${PORT}`);
// });

// PostgreSQL connection settings
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'postgres',
  port: 5432,
  schema: 'tokenres'
});

// Create or alter tbtoken table
async function createOrAlterTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tokenres.tbtoken (
        address VARCHAR(255) PRIMARY KEY,
        created_date TIMESTAMP WITH TIME ZONE, 
        created_time DECIMAL(10, 2),
        decimals INTEGER,
        name VARCHAR(255),
        status VARCHAR(255),
        symbol VARCHAR(255)
      );
    `);

    await pool.query(`
      ALTER TABLE tokenres.tbtoken
      ADD COLUMN IF NOT EXISTS holders NUMERIC,
      ADD COLUMN IF NOT EXISTS marketcap NUMERIC,
      ADD COLUMN IF NOT EXISTS supply NUMERIC,
      ADD COLUMN IF NOT EXISTS price NUMERIC,
      ADD COLUMN IF NOT EXISTS volume_24h NUMERIC,
      ADD COLUMN IF NOT EXISTS created_on VARCHAR,
      ADD COLUMN IF NOT EXISTS freeze_authority VARCHAR;
    `);

    console.log('tbtoken table created or altered successfully');
  } catch (error) {
    console.error('Error creating or altering tbtoken table:', error);
  }
}

// Initialize table creation or alteration
createOrAlterTable();

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

      // Fetch additional details for the token from the secondary API
      const tokenMetaResponse = await axios.get(`https://pro-api.solscan.io/v2.0/token/meta?address=${token.address}`, {
        headers: {
          'token': API_TOKEN,
        },
      });

      const tokenMeta = tokenMetaResponse.data.data || {};

      // Insert new record, including only fields that are available
      const insertQuery = {
        text: `INSERT INTO tokenres.tbtoken (address, decimals, name, symbol, created_time, created_date, holders, marketcap, supply, price, volume_24h, created_on, freeze_authority) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        values: [
          token.address,
          token.decimals,
          token.name,
          token.symbol,
          token.created_time,
          new Date(token.created_time * 1000).toISOString(),
          tokenMeta.holder || null,
          tokenMeta.market_cap || null,
          tokenMeta.supply || null,
          tokenMeta.price || null,
          tokenMeta.volume_24h || null,
          tokenMeta.metadata?.createdOn || null,
          tokenMeta.freeze_authority || null
        ].map(value => (value !== undefined ? value : null)),
      };

      await pool.query(insertQuery);
      console.log(`Address ${token.address} inserted successfully.`);
    }

    return true; // Data fetched and processed successfully
  } catch (error) {
    console.error(`Error fetching or saving data from page ${page}:`, error);
    return false;
  }
}

// Cron job to fetch token data from Solscan API every 30 seconds
cron.schedule('*/30 * * * * *', async () => { // Runs every 30 seconds
  console.log('Starting to fetch data from Solscan API...');

  for (let page = 1; page <= 2; page++) {
    console.log(`Fetching data for page ${page}...`);
    const success = await fetchAndSaveData(page);
    if (!success) break; // Stop if no data is returned
  }

  console.log('Data fetching completed.');
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// API endpoint to retrieve token list from PostgreSQL database
app.get('/api/tokens', async (req, res) => {
  try {
    const query = {
      text: "SELECT * FROM tokenres.tbtoken ORDER BY created_time DESC;"
    };
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving token list' });
  }
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});
