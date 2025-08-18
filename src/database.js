const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

// File path for database
const file = path.join(__dirname, '../database/database.json');
const adapter = new JSONFile(file);
let defaultDB = {clients:[]}
const db = new Low(adapter,defaultDB);

// Initialize default structure
async function initDB() {
  await db.read();

  db.data ||= {
    clients: []  
  };
  await db.write();
}

initDB();

module.exports = db;
