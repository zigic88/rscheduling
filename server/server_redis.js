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

// Middleware to parse JSON
app.use(express.json());

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
      ADD COLUMN IF NOT EXISTS holders VARCHAR,
      ADD COLUMN IF NOT EXISTS marketcap VARCHAR,
      ADD COLUMN IF NOT EXISTS supply VARCHAR,
      ADD COLUMN IF NOT EXISTS price VARCHAR,
      ADD COLUMN IF NOT EXISTS volume_24h VARCHAR,
      ADD COLUMN IF NOT EXISTS created_on VARCHAR,
      ADD COLUMN IF NOT EXISTS freeze_authority VARCHAR;
    `);

    await pool.query(`
      ALTER TABLE tokenres.tbtoken
      ALTER COLUMN holders TYPE VARCHAR,
      ALTER COLUMN marketcap TYPE VARCHAR,
      ALTER COLUMN supply TYPE VARCHAR,
      ALTER COLUMN price TYPE VARCHAR,
      ALTER COLUMN volume_24h TYPE VARCHAR,
      ALTER COLUMN created_on TYPE VARCHAR,
      ALTER COLUMN freeze_authority TYPE VARCHAR;
    `);

    await pool.query(`
      ALTER TABLE tokenres.tbtoken
      ADD COLUMN IF NOT EXISTS metadata_name VARCHAR,
      ADD COLUMN IF NOT EXISTS metadata_symbol VARCHAR,
      ADD COLUMN IF NOT EXISTS metadata_image VARCHAR;
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

      // Extract metadata attributes safely
      const metadataImage = tokenMeta.metadata?.image || null;
      const metadataName = tokenMeta.metadata?.name || null;
      const metadataSymbol = tokenMeta.metadata?.symbol || null;

      // Insert new record, including only fields that are available
      const insertQuery = {
        text: `INSERT INTO tokenres.tbtoken (address, decimals, name, symbol, created_time, created_date, holders, marketcap, supply, price, volume_24h, created_on, freeze_authority, metadata_name, metadata_symbol, metadata_image) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
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
          metadataName, metadataSymbol, metadataImage
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
cron.schedule('*/3000 * * * * *', async () => { // Runs every 30 seconds
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
            metadata_image = $10
          WHERE address = $11
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
    let { page, limit, name, symbol, address, decimals, created_date,
      holders, market_cap, supply, price, volume_24h,
      created_on, freeze_authority, metadata_name, metadata_symbol, metadata_image,
      excludePump, excludeMoon, createdOn, difMetadataName, difMetadataSymbol } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM tokenres.tbtoken WHERE 1=1`;
    let queryParams = [];
    let countQuery = `SELECT COUNT(*) FROM tokenres.tbtoken WHERE 1=1`;

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

    console.log('excludePump: ', excludePump);
    console.log('excludeMoon: ', excludeMoon);
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
    }

    if (difMetadataName === 'true') {
      console.log('difMetadataName is true');
      query += ` AND LOWER(name) <> LOWER(metadata_name)`;
      countQuery += ` AND LOWER(name) = LOWER(metadata_name)`;
    }

    if (difMetadataSymbol === 'true') {
      console.log('difMetadataSymbol is true');
      query += ` AND LOWER(symbol) <> LOWER(metadata_symbol)`;
      countQuery += ` AND LOWER(symbol) = LOWER(metadata_symbol)`;
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

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});
