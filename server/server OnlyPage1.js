const express = require('express');
const app = express();
const cron = require('node-cron');
const axios = require('axios');
const { Pool } = require('pg');

// PostgreSQL connection settings
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'postgres',
  port: 5432,
  schema: 'tokenres'
});

// Create tbtoken table if it doesn't exist
async function createTable() {
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
      console.log('tbtoken table created or already exists');
    } catch (error) {
      console.error('Error creating tbtoken table:', error);
    }
  }

// Initialize table creation
createTable();

// Cron job to pull token list from Solscan API every hour
cron.schedule('*/30 * * * * *', async () => {
  try {
    const response = await axios.get('https://pro-api.solscan.io/v2.0/token/list?page=1&page_size=100', {
      headers: {
        'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3MzMwNjc2NzAyNTMsImVtYWlsIjoib2hkYW1uaXRzdG9ueUBvdXRsb29rLmNvbSIsImFjdGlvbiI6InRva2VuLWFwaSIsImFwaVZlcnNpb24iOiJ2MiIsImlhdCI6MTczMzA2NzY3MH0.teF5vKuH870DbErbrWWN6AMoeWgimukmV1ies3dm7p8',
      },
    });
    const dataArray = response.data;
    const tokenList = dataArray.data;
    console.log('response dataArray: ' + dataArray);
    console.log('response data only: ' + tokenList);

    const query =
    `INSERT INTO tokenres.tbtoken (address, decimals, name, symbol, created_time, created_date)
     VALUES ${tokenList
       .map(
         (_, index) =>
            `($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6})`
       )
       .join(', ')}`;

    // Construct the values
    const values = tokenList.flatMap(token => [
        token.address,
        token.decimals,
        token.name,
        token.symbol,
        token.created_time,
        new Date(token.created_time * 1000).toISOString(),
    ]);

    await pool.query(query, values)
    .then(res => console.log(res))
    .catch(e => console.error(e));

  } catch (error) {
    console.error(error);
  }
});

// var cors = require('cors')
// const corsOptions = {
//     origin: 'https://4fa6-180-242-131-181.ngrok-free.app',//(https://your-client-app.com)
//     optionsSuccessStatus: 200,
//   };  
// app.use(cors(corsOptions));
// app.use(cors());
// const { createProxyMiddleware } = require('http-proxy-middleware');
// app.use('/api', createProxyMiddleware({ 
//     target: 'http://localhost:8080/', //original url
//     changeOrigin: true, 
//     //secure: false,
//     onProxyRes: function (proxyRes, req, res) {
//        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
//     }
// }));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// API endpoint to retrieve token list from PostgreSQL database
app.get('/api/tokens', async (req, res) => {
  try {
    const query = {
      text: "SELECT * FROM tokenres.tbtoken WHERE ADDRESS NOT ILIKE $1 AND ADDRESS NOT ILIKE $2 order by created_time DESC;",
    };
    const values = ['%moon', '%pump'];
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving token list' });
  }
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});