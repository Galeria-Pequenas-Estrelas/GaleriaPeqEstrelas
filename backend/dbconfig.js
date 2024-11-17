const Database = require('better-sqlite3');
const db = new Database('./database/database.db');

module.exports = db;