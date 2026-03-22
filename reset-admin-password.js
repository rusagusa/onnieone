// reset-admin-password.js — One-shot script to reset the admin password
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data/news.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error('Could not connect to database:', err.message); process.exit(1); }
});

const adminUser = process.env.ADMIN_USER || 'admin';
const adminPass = process.env.ADMIN_PASS || 'admin123';

const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(adminPass, salt);

db.serialize(() => {
    // Check if admin user exists
    db.get('SELECT id FROM users WHERE username = ?', [adminUser], (err, row) => {
        if (row) {
            // Update existing
            db.run('UPDATE users SET password = ? WHERE username = ?', [hash, adminUser], (err) => {
                if (err) console.error(err.message);
                else console.log(`✅ Password reset for user "${adminUser}" — you can now log in with the credentials in your .env file.`);
                db.close();
            });
        } else {
            // Create the admin
            db.run(
                `INSERT INTO users (username, password, role, full_name, is_active) VALUES (?, ?, 'admin', 'System Administrator', 1)`,
                [adminUser, hash],
                (err) => {
                    if (err) console.error(err.message);
                    else console.log(`✅ Admin user "${adminUser}" created successfully.`);
                    db.close();
                }
            );
        }
    });
});
