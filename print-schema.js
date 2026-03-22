const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const db = new sqlite3.Database('./data/news.db');

db.all("SELECT sql FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) throw err;
    fs.writeFileSync('schema.txt', rows.map(r => r.sql).join('\n\n'));
    console.log('Schema written to schema.txt');
});
