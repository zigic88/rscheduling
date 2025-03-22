const { Pool } = require('pg');
// PostgreSQL connection settings

//For Localhost
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
    schema: 'tokenres'
});

//For Server
// const pool = new Pool({
//     user: 'postgres',
//     host: 'localhost',
//     database: 'dbrscheduling',
//     password: 'G0d0fw4R#321',
//     port: 5432,
//     schema: 'tokenres'
// });

pool.on('connect', () => {
    console.log('Connected to the database');
});

pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    process.exit(-1);
});

module.exports = pool;