const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const multer = require('multer');

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) cb(null, true);
        else cb(new Error('Only images are allowed'));
    }
});

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.redirect('/admin/login');
};

// Admin login page
router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/admin/dashboard');
    res.render('admin/login', {
        error: req.query.error ? 'Invalid username or password' : null
    });
});

// Admin login post
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (!user) {
            return res.redirect('/admin/login?error=1');
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.redirect('/admin/login?error=1');
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role
        };

        res.redirect('/admin/dashboard');
    });
});

// Admin logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Admin Dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
    db.get('SELECT COUNT(*) as total FROM articles', (err, totalArticles) => {
        db.get('SELECT SUM(views) as total FROM articles', (err, totalViews) => {
            db.get('SELECT COUNT(*) as total FROM categories', (err, totalCategories) => {
                db.get('SELECT COUNT(*) as total FROM advertisements', (err, totalAds) => {

                    db.all(`SELECT a.*, c.name_en as category_name 
                            FROM articles a 
                            LEFT JOIN categories c ON a.category_id = c.id 
                            ORDER BY a.created_at DESC LIMIT 5`, (err, recentArticles) => {

                        const stats = {
                            totalArticles: totalArticles?.total || 0,
                            totalViews: totalViews?.total || 0,
                            totalCategories: totalCategories?.total || 0,
                            totalAds: totalAds?.total || 0
                        };

                        res.render('admin/dashboard', {
                            user: req.session.user,
                            stats: stats,
                            recentArticles: recentArticles || [],
                            currentPage: 'dashboard',
                            pageTitle: 'Dashboard'
                        });
                    });
                });
            });
        });
    });
});

// Admin News list
router.get('/news', isAuthenticated, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let query = `SELECT a.*, c.name_en as category_name 
                FROM articles a 
                LEFT JOIN categories c ON a.category_id = c.id`;
    let countQuery = 'SELECT COUNT(*) as total FROM articles a';
    let params = [];
    let countParams = [];

    if (search) {
        query += ` WHERE a.title_en LIKE ? OR a.content_en LIKE ?`;
        countQuery += ` WHERE a.title_en LIKE ? OR a.content_en LIKE ?`;
        params = [`%${search}%`, `%${search}%`, limit, offset];
        countParams = [`%${search}%`, `%${search}%`];
    } else {
        params = [limit, offset];
    }

    query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;

    db.all(query, params, (err, news) => {
        db.get(countQuery, countParams, (err, count) => {
            const totalPages = Math.ceil((count?.total || 0) / limit);

            res.render('admin/news', {
                user: req.session.user,
                news: news || [],
                currentPage: 'news',
                pageTitle: 'Manage News',
                pagination: {
                    page: page,
                    totalPages: totalPages,
                    totalItems: count?.total || 0
                },
                search: search
            });
        });
    });
});

// Add Article Form
router.get('/news/add', isAuthenticated, (req, res) => {
    db.all('SELECT * FROM categories ORDER BY name_en', (err, categories) => {
        res.render('admin/add-news', {
            user: req.session.user,
            categories: categories || [],
            error: null
        });
    });
});

// Add Article Post
router.post('/news/add', isAuthenticated, upload.single('image'), (req, res) => {
    const {
        title_en, title_fr, title_rw, category_id, status,
        summary_en, content_en, content_fr, content_rw,
        author, source_name, source_url, is_featured, is_breaking
    } = req.body;

    if (!title_en || !content_en || !category_id) {
        return db.all('SELECT * FROM categories ORDER BY name_en', (errCat, categories) => {
            res.render('admin/add-news', {
                user: req.session.user,
                categories: categories || [],
                error: 'Title, Content and Category are strictly required.'
            });
        });
    }

    const imageUrl = req.file ? '/uploads/' + req.file.filename : null;
    const authorId = req.session.user.id;
    const publishedAt = status === 'published' ? new Date().toISOString() : null;

    db.run(`INSERT INTO articles(
        title_en, content_en, category_id, image_url, source_name, source_url,
        author_id, is_featured, is_breaking, status, published_at
    ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            title_en, content_en, category_id, imageUrl, source_name, source_url,
            authorId, is_featured ? 1 : 0, is_breaking ? 1 : 0, status || 'draft', publishedAt
        ], function (err) {
            if (err) {
                console.error('Error adding article:', err);
                return db.all('SELECT * FROM categories ORDER BY name_en', (errCat, categories) => {
                    res.render('admin/add-news', {
                        user: req.session.user,
                        categories: categories || [],
                        error: 'Error adding article. Please try again.'
                    });
                });
            }

            const newId = this.lastID;
            if (is_breaking) {
                db.run('INSERT INTO breaking_news (article_id, is_active) VALUES (?, 1)', [newId]);
            }
            res.redirect('/admin/news');
        });
});

// Edit Article Form
router.get('/news/edit/:id', isAuthenticated, (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM articles WHERE id = ?', [id], (err, article) => {
        if (!article) return res.redirect('/admin/news');

        db.all('SELECT * FROM categories ORDER BY name_en', (err, categories) => {
            res.render('admin/edit-news', {
                user: req.session.user,
                article: article,
                categories: categories || [],
                error: null
            });
        });
    });
});

// Edit Article Post
router.post('/news/edit/:id', isAuthenticated, upload.single('image'), (req, res) => {
    const id = req.params.id;
    const {
        title_en, category_id, status, summary_en, content_en,
        author, source_name, source_url, is_featured, is_breaking
    } = req.body;

    let query = `UPDATE articles SET
    title_en = ?, content_en = ?, category_id = ?, source_name = ?,
        source_url = ?, is_featured = ?, is_breaking = ?, status = ? `;
    let params = [
        title_en, content_en, category_id, source_name, source_url,
        is_featured ? 1 : 0, is_breaking ? 1 : 0, status || 'draft'
    ];

    if (status === 'published') {
        query += `, published_at = COALESCE(published_at, CURRENT_TIMESTAMP)`;
    }

    if (req.file) {
        query += `, image_url = ? `;
        params.push('/uploads/' + req.file.filename);
    }

    query += ` WHERE id = ? `;
    params.push(id);

    db.run(query, params, function (err) {
        if (err) console.error('Error updating article:', err);

        // Handle breaking news toggle
        if (is_breaking) {
            db.run('INSERT OR IGNORE INTO breaking_news (article_id, is_active) VALUES (?, 1)', [id]);
        } else {
            db.run('DELETE FROM breaking_news WHERE article_id = ?', [id]);
        }

        res.redirect('/admin/news');
    });
});

// Delete Article
router.post('/news/delete/:id', isAuthenticated, (req, res) => {
    const id = req.params.id;

    // Begin transaction basically
    db.serialize(() => {
        db.run('DELETE FROM breaking_news WHERE article_id = ?', [id]);
        db.run('DELETE FROM comments WHERE article_id = ?', [id]);
        db.run('DELETE FROM articles WHERE id = ?', [id], function (err) {
            if (err) {
                console.error(err);
                res.json({ success: false });
            } else {
                res.json({ success: true });
            }
        });
    });
});

// ==================== CATEGORIES ====================

// List Categories
router.get('/categories', isAuthenticated, (req, res) => {
    db.all(`SELECT c.*, COUNT(a.id) as news_count 
            FROM categories c 
            LEFT JOIN articles a ON c.id = a.category_id 
            GROUP BY c.id ORDER BY c.order_position`, (err, categories) => {
        res.render('admin/categories', {
            user: req.session.user,
            categories: categories || []
        });
    });
});

// Add Category API
router.post('/categories/add', isAuthenticated, (req, res) => {
    const { name_en, name_fr, name_rw, slug, icon, description, order_position } = req.body;

    // Auto-generate slug if not provided
    const finalSlug = slug || name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    db.run(`INSERT INTO categories(name_en, slug, icon, description, order_position, is_active)
    VALUES(?, ?, ?, ?, ?, 1)`,
        [name_en, finalSlug, icon || 'fas fa-tag', description, order_position || 0],
        function (err) {
            if (err) {
                console.error(err);
                return res.json({ success: false, error: err.message });
            }
            res.json({ success: true, id: this.lastID });
        }
    );
});

// Toggle Category Status
router.post('/categories/toggle/:id', isAuthenticated, (req, res) => {
    db.run(`UPDATE categories SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ? `,
        [req.params.id], function (err) {
            res.json({ success: !err });
        }
    );
});

// Delete Category
router.post('/categories/delete/:id', isAuthenticated, (req, res) => {
    // Before deleting a category, we should set related articles category_id to NULL
    db.serialize(() => {
        db.run('UPDATE articles SET category_id = NULL WHERE category_id = ?', [req.params.id]);
        db.run('DELETE FROM categories WHERE id = ?', [req.params.id], function (err) {
            res.json({ success: !err });
        });
    });
});

// ==================== USERS ====================

// List Users
router.get('/users', isAuthenticated, (req, res) => {
    db.all('SELECT id, username, full_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC', (err, users) => {
        res.render('admin/users', {
            user: req.session.user,
            users: users || []
        });
    });
});

// Add User Form
router.get('/users/add', isAuthenticated, (req, res) => {
    res.render('admin/add-user', {
        user: req.session.user,
        error: null
    });
});

// Add User Action
router.post('/users/add', isAuthenticated, async (req, res) => {
    const { username, password, full_name, email, role } = req.body;

    db.get('SELECT id FROM users WHERE username = ?', [username], async (err, existing) => {
        if (existing) {
            return res.render('admin/add-user', {
                user: req.session.user,
                error: 'Username already exists'
            });
        }

        try {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            db.run(`INSERT INTO users(username, password, full_name, email, role, is_active)
    VALUES(?, ?, ?, ?, ?, 1)`,
                [username, hash, full_name, email, role || 'editor'],
                (err) => {
                    if (err) {
                        return res.render('admin/add-user', {
                            user: req.session.user,
                            error: 'Error creating user'
                        });
                    }
                    res.redirect('/admin/users');
                }
            );
        } catch (error) {
            res.render('admin/add-user', { user: req.session.user, error: 'Password hashing failed' });
        }
    });
});

// Toggle User Status
router.post('/users/toggle/:id', isAuthenticated, (req, res) => {
    db.run(`UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ? AND username != 'admin'`,
        [req.params.id], function (err) {
            res.json({ success: !err });
        }
    );
});

// Delete User
router.post('/users/delete/:id', isAuthenticated, (req, res) => {
    db.run(`DELETE FROM users WHERE id = ? AND username != 'admin'`, [req.params.id], function (err) {
        res.json({ success: !err });
    });
});

// ==================== SETTINGS ====================

// Settings Page
router.get('/settings', isAuthenticated, (req, res) => {
    db.all('SELECT * FROM site_settings', (err, settingsArray) => {
        const settings = {};
        if (settingsArray) {
            settingsArray.forEach(s => settings[s.setting_key] = s.setting_value);
        }
        res.render('admin/settings', {
            user: req.session.user,
            settings: settings
        });
    });
});

// Save Settings
router.post('/settings/save', isAuthenticated, (req, res) => {
    const settings = req.body;
    let completed = 0;
    const totalKeys = Object.keys(settings).length;

    if (totalKeys === 0) return res.json({ success: true });

    db.serialize(() => {
        const stmt = db.prepare('INSERT OR REPLACE INTO site_settings (setting_key, setting_value) VALUES (?, ?)');
        Object.keys(settings).forEach(key => {
            stmt.run(key, settings[key], function (err) {
                completed++;
                if (completed === totalKeys) {
                    stmt.finalize();
                    res.json({ success: true });
                }
            });
        });
    });
});

// ==================== COMMENTS ====================
router.get('/comments', isAuthenticated, (req, res) => {
    db.all(`SELECT c.*, a.title_en as article_title 
            FROM comments c 
            JOIN articles a ON c.article_id = a.id 
            ORDER BY c.created_at DESC`, (err, comments) => {
        res.render('admin/comments', { user: req.session.user, comments: comments || [] });
    });
});

router.post('/comments/toggle/:id', isAuthenticated, (req, res) => {
    db.run(`UPDATE comments SET is_approved = CASE WHEN is_approved = 1 THEN 0 ELSE 1 END WHERE id = ?`, [req.params.id], function (err) {
        res.json({ success: !err });
    });
});

router.post('/comments/delete/:id', isAuthenticated, (req, res) => {
    db.run(`DELETE FROM comments WHERE id = ?`, [req.params.id], function (err) {
        res.json({ success: !err });
    });
});

// ==================== MEDIA (GALLERIES & VIDEOS) ====================
router.get('/galleries', isAuthenticated, (req, res) => {
    db.all(`SELECT m.*, u.username as uploader_name FROM media m LEFT JOIN users u ON m.uploaded_by = u.id WHERE m.type LIKE 'image%' ORDER BY m.created_at DESC`, (err, media) => {
        res.render('admin/galleries', { user: req.session.user, media: media || [] });
    });
});

router.get('/videos', isAuthenticated, (req, res) => {
    db.all(`SELECT m.*, u.username as uploader_name FROM media m LEFT JOIN users u ON m.uploaded_by = u.id WHERE m.type LIKE 'video%' ORDER BY m.created_at DESC`, (err, media) => {
        res.render('admin/videos', { user: req.session.user, media: media || [] });
    });
});

router.post('/media/delete/:id', isAuthenticated, (req, res) => {
    db.run(`DELETE FROM media WHERE id = ?`, [req.params.id], function (err) {
        res.json({ success: !err });
    });
});

// ==================== AUCTIONS ====================
router.get('/auctions', isAuthenticated, (req, res) => {
    db.all(`SELECT * FROM auction_news ORDER BY created_at DESC`, (err, auctions) => {
        res.render('admin/auctions', { user: req.session.user, auctions: auctions || [] });
    });
});

router.post('/auctions/add', isAuthenticated, (req, res) => {
    const { title_en, price, location, end_date } = req.body;
    db.run(`INSERT INTO auction_news (title_en, price, location, end_date, is_active) VALUES (?, ?, ?, ?, 1)`, [title_en, price, location, end_date], function (err) {
        res.redirect('/admin/auctions');
    });
});

router.post('/auctions/toggle/:id', isAuthenticated, (req, res) => {
    db.run(`UPDATE auction_news SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?`, [req.params.id], function (err) {
        res.json({ success: !err });
    });
});

router.post('/auctions/delete/:id', isAuthenticated, (req, res) => {
    db.run(`DELETE FROM auction_news WHERE id = ?`, [req.params.id], function (err) {
        res.json({ success: !err });
    });
});

// ==================== ANNOUNCEMENTS ====================
router.get('/announcements', isAuthenticated, (req, res) => {
    db.all(`SELECT * FROM announcements ORDER BY created_at DESC`, (err, announcements) => {
        res.render('admin/announcements', { user: req.session.user, announcements: announcements || [] });
    });
});

router.post('/announcements/add', isAuthenticated, (req, res) => {
    const { title_en, content_en, priority } = req.body;
    db.run(`INSERT INTO announcements (title_en, content_en, priority, is_active) VALUES (?, ?, ?, 1)`, [title_en, content_en, priority || 'normal'], function (err) {
        res.redirect('/admin/announcements');
    });
});

router.post('/announcements/toggle/:id', isAuthenticated, (req, res) => {
    db.run(`UPDATE announcements SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?`, [req.params.id], function (err) {
        res.json({ success: !err });
    });
});

router.post('/announcements/delete/:id', isAuthenticated, (req, res) => {
    db.run(`DELETE FROM announcements WHERE id = ?`, [req.params.id], function (err) {
        res.json({ success: !err });
    });
});

// ==================== HISTORY ====================
router.get('/history', isAuthenticated, (req, res) => {
    db.all(`SELECT * FROM today_history ORDER BY year DESC`, (err, history) => {
        res.render('admin/history', { user: req.session.user, history: history || [] });
    });
});

router.post('/history/add', isAuthenticated, (req, res) => {
    const { year, event_en } = req.body;
    db.run(`INSERT INTO today_history (year, event_en, is_active) VALUES (?, ?, 1)`, [year, event_en], function (err) {
        res.redirect('/admin/history');
    });
});

router.post('/history/toggle/:id', isAuthenticated, (req, res) => {
    db.run(`UPDATE today_history SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?`, [req.params.id], function (err) {
        res.json({ success: !err });
    });
});

router.post('/history/delete/:id', isAuthenticated, (req, res) => {
    db.run(`DELETE FROM today_history WHERE id = ?`, [req.params.id], function (err) {
        res.json({ success: !err });
    });
});

// ==================== POPULAR ====================
router.get('/popular', isAuthenticated, (req, res) => {
    db.all(`SELECT a.*, c.name_en as category_name FROM articles a LEFT JOIN categories c ON a.category_id = c.id WHERE a.views > 0 ORDER BY a.views DESC LIMIT 50`, (err, articles) => {
        res.render('admin/popular', { user: req.session.user, articles: articles || [] });
    });
});

// ==================== PROFILE ====================
router.get('/profile', isAuthenticated, (req, res) => {
    db.get('SELECT * FROM users WHERE id = ?', [req.session.user.id], (err, user) => {
        res.render('admin/profile', { user: user, sessionUser: req.session.user });
    });
});

router.post('/profile', isAuthenticated, async (req, res) => {
    const { full_name, email, password } = req.body;
    let query = 'UPDATE users SET full_name = ?, email = ?';
    let params = [full_name, email];

    if (password) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        query += ', password = ?';
        params.push(hash);
    }

    query += ' WHERE id = ?';
    params.push(req.session.user.id);

    db.run(query, params, function (err) {
        if (!err) req.session.user.full_name = full_name;
        res.redirect('/admin/profile?success=1');
    });
});

// ==================== LIVE EDITOR ====================
router.get('/live-editor', isAuthenticated, (req, res, next) => {
    const queries = {
        categories: 'SELECT * FROM categories WHERE is_active = 1 ORDER BY order_position',
        articles: `SELECT a.*, c.name_en as category_name FROM articles a 
                   LEFT JOIN categories c ON a.category_id = c.id 
                   WHERE a.status = 'published' ORDER BY a.published_at DESC LIMIT 10`,
        breakingNews: `SELECT b.*, a.title_en, a.image_url, a.published_at 
                       FROM breaking_news b 
                       LEFT JOIN articles a ON b.article_id = a.id 
                       WHERE b.is_active = 1 ORDER BY b.slide_order`,
        featuredArticle: `SELECT a.*, c.name_en as category_name FROM articles a 
                          LEFT JOIN categories c ON a.category_id = c.id
                          WHERE a.is_featured = 1 AND a.status = 'published' 
                          ORDER BY a.published_at DESC LIMIT 1`,
        ads: 'SELECT * FROM advertisements WHERE is_active = 1',
        auctions: 'SELECT * FROM auction_news WHERE is_active = 1 ORDER BY created_at DESC LIMIT 5',
        announcements: 'SELECT * FROM announcements WHERE is_active = 1 ORDER BY priority DESC LIMIT 5',
        history: 'SELECT * FROM today_history WHERE is_active = 1 ORDER BY year DESC LIMIT 5',
        updates: 'SELECT * FROM real_time_updates WHERE is_active = 1 ORDER BY priority DESC LIMIT 10',
        settings: 'SELECT * FROM site_settings'
    };

    const results = {};
    let completed = 0;
    const total = Object.keys(queries).length;

    Object.keys(queries).forEach(key => {
        db.all(queries[key], (err, data) => {
            if (err) return next(err);
            results[key] = data || [];
            completed++;

            if (completed === total) {
                const settingsObj = {};
                results.settings.forEach(s => settingsObj[s.setting_key] = s.setting_value);

                res.render('admin/live-editor', {
                    categories: results.categories,
                    articles: results.articles,
                    breakingNews: results.breakingNews,
                    featuredArticle: results.featuredArticle[0],
                    ads: results.ads,
                    auctions: results.auctions,
                    announcements: results.announcements,
                    history: results.history,
                    updates: results.updates,
                    settings: settingsObj,
                    bigNews: results.articles.length > 0 ? results.articles[0] : null,
                    user: req.session.user
                });
            }
        });
    });
});

router.post('/api/live-edit/text', isAuthenticated, (req, res) => {
    const { type, id, field, key, value } = req.body;
    let query = '';
    let params = [];

    const allowedTables = {
        'article': 'articles',
        'category': 'categories',
        'ticker': 'real_time_updates',
        'history': 'today_history',
        'auction': 'auction_news',
        'announcement': 'announcements'
    };

    if (type === 'site_setting') {
        query = 'INSERT OR REPLACE INTO site_settings (setting_key, setting_value) VALUES (?, ?)';
        params = [key, value];
    } else if (allowedTables[type]) {
        const table = allowedTables[type];
        // Whitelist allowed fields to prevent SQL injection
        const allowedFields = ['title_en', 'content_en', 'name_en', 'event_en', 'year', 'price', 'location', 'summary_en'];
        if (!allowedFields.includes(field)) {
            return res.json({ success: false, error: 'Invalid field' });
        }
        query = `UPDATE ${table} SET ${field} = ? WHERE id = ?`;
        params = [value, id];
    } else {
        return res.json({ success: false, error: 'Unknown type' });
    }

    db.run(query, params, function (err) {
        if (err) return res.json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

router.post('/api/live-edit/image', isAuthenticated, upload.single('image'), (req, res) => {
    if (!req.file) return res.json({ success: false, error: 'No file uploaded' });

    const { type, id, loc } = req.body;
    const imageUrl = '/uploads/' + req.file.filename;

    let query = '';
    let params = [];

    if (type === 'site_setting') {
        // e.g. updating the logo
        query = 'INSERT OR REPLACE INTO site_settings (setting_key, setting_value) VALUES (?, ?)';
        params = ['site_logo', imageUrl];
    } else if (type === 'article_image') {
        query = 'UPDATE articles SET image_url = ? WHERE id = ?';
        params = [imageUrl, id];
    } else if (type === 'ad') {
        query = 'UPDATE advertisements SET image_url = ? WHERE id = ?';
        params = [imageUrl, id];
    } else if (type === 'new_ad') {
        query = 'INSERT INTO advertisements (title, image_url, location, is_active) VALUES (?, ?, ?, 1)';
        params = [`Ad ${loc} `, imageUrl, loc];
    } else {
        return res.json({ success: false, error: 'Unknown type' });
    }

    db.run(query, params, function (err) {
        if (err) return res.json({ success: false, error: err.message });
        res.json({ success: true, newId: this.lastID || id });
    });
});

module.exports = router;
