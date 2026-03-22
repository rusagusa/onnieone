const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbDir = path.dirname(process.env.DB_PATH || './data/news.db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(process.env.DB_PATH || './data/news.db');

db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'editor',
        full_name TEXT,
        email TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Categories table
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_en TEXT,
        slug TEXT UNIQUE,
        icon TEXT,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        order_position INTEGER DEFAULT 0
    )`);

    // Articles table (was 'news' in old version)
    db.run(`CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title_en TEXT,
        content_en TEXT,
        category_id INTEGER,
        image_url TEXT,
        source_name TEXT,
        source_url TEXT,
        author_id INTEGER,
        views INTEGER DEFAULT 0,
        is_trending INTEGER DEFAULT 0,
        is_featured INTEGER DEFAULT 0,
        is_breaking INTEGER DEFAULT 0,
        status TEXT DEFAULT 'draft',
        published_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (author_id) REFERENCES users(id)
    )`);

    // Breaking News slide mapping
    db.run(`CREATE TABLE IF NOT EXISTS breaking_news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER,
        slide_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (article_id) REFERENCES articles(id)
    )`);

    // Advertisements
    db.run(`CREATE TABLE IF NOT EXISTS advertisements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        image_url TEXT,
        link_url TEXT,
        position TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Auction News
    db.run(`CREATE TABLE IF NOT EXISTS auction_news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title_en TEXT,
        price TEXT,
        location TEXT,
        end_date DATETIME,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Announcements
    db.run(`CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title_en TEXT,
        content_en TEXT,
        priority TEXT DEFAULT 'normal',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Today in History
    db.run(`CREATE TABLE IF NOT EXISTS today_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER,
        event_en TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Real-time Updates (Ticker)
    db.run(`CREATE TABLE IF NOT EXISTS real_time_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_en TEXT,
        priority INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Site Settings
    db.run(`CREATE TABLE IF NOT EXISTS site_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE,
        setting_value TEXT
    )`);

    // Comments table
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER,
        name TEXT,
        email TEXT,
        comment TEXT,
        is_approved INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id)
    )`);

    // Media table
    db.run(`CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT,
        original_name TEXT,
        path TEXT,
        type TEXT,
        size INTEGER,
        uploaded_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )`);

    // Insert default categories
    const categories = [
        ['Sports', 'sports', 'fa-futbol', 'Latest sports news from Africa and beyond'],
        ['Entertainment', 'entertainment', 'fa-film', 'Movies, music, celebrity news'],
        ['Politics', 'politics', 'fa-landmark', 'Political news and analysis'],
        ['Comedy', 'comedy', 'fa-face-smile', 'Humor, jokes and funny stories'],
        ['Business', 'business', 'fa-chart-line', 'Finance, economy and business news'],
        ['Technology', 'technology', 'fa-laptop', 'Tech news and innovations'],
        ['Tourism', 'tourism', 'fa-plane', 'Travel and tourism in Rwanda'],
        ['Fashion', 'fashion', 'fa-tshirt', 'Fashion and lifestyle']
    ];

    categories.forEach((cat, index) => {
        db.run(`INSERT OR IGNORE INTO categories (name_en, slug, icon, description, order_position) VALUES (?, ?, ?, ?, ?)`,
            cat[0], cat[1], cat[2], cat[3], index + 1);
    });

    // Create admin user from ENV or default
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin123';

    // Check if admin exists to avoid re-hashing default password over changed one
    db.get('SELECT * FROM users WHERE username = ?', [adminUser], (err, row) => {
        if (!row) {
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(adminPass, salt);
            db.run(`INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)`,
                [adminUser, hash, 'admin', 'System Administrator']);
        }
    });

    // Default Site Settings
    db.run(`INSERT OR IGNORE INTO site_settings (setting_key, setting_value) VALUES 
        ('site_name', 'ONNIEONE NEWS'),
        ('site_description', 'Rwanda''s Premier News Platform'),
        ('contact_email', 'info@onnieone.com')
    `);

    console.log('✅ Database initialized successfully with updated schema!');
});

db.close();
