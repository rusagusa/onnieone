const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database('./data/news.db');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.redirect('/admin/login');
    }
};

// ==================== DASHBOARD ====================
router.get('/', isAdmin, (req, res) => {
    res.redirect('/admin/dynamic/menus');
});

// ==================== MENU MANAGEMENT ====================
router.get('/menus', isAdmin, (req, res) => {
    db.all('SELECT * FROM menu_items ORDER BY order_position', (err, menus) => {
        res.render('admin/dynamic/menus', { 
            menus: menus || [],
            user: req.session.user,
            lang: req.lang || 'en'
        });
    });
});

router.post('/menus/add', isAdmin, express.json(), (req, res) => {
    const { title_en, title_fr, title_rw, url, icon, parent_id, order_position } = req.body;
    db.run(`INSERT INTO menu_items (title_en, title_fr, title_rw, url, icon, parent_id, order_position) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title_en, title_fr || title_en, title_rw || title_en, url, icon, parent_id || 0, order_position || 0],
        function(err) {
            if (err) {
                console.error(err);
                res.json({ success: false, error: err.message });
            } else {
                res.json({ success: true, id: this.lastID });
            }
        });
});

router.post('/menus/delete/:id', isAdmin, (req, res) => {
    db.run('DELETE FROM menu_items WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            res.json({ success: false });
        } else {
            res.json({ success: true });
        }
    });
});

// ==================== TOP BAR LINKS ====================
router.get('/top-bar', isAdmin, (req, res) => {
    db.all('SELECT * FROM top_bar_links ORDER BY order_position', (err, links) => {
        res.render('admin/dynamic/top-bar', { 
            links: links || [],
            user: req.session.user,
            lang: req.lang || 'en'
        });
    });
});

router.post('/top-bar/add', isAdmin, express.json(), (req, res) => {
    const { title_en, title_fr, title_rw, url, icon, order_position } = req.body;
    db.run(`INSERT INTO top_bar_links (title_en, title_fr, title_rw, url, icon, order_position) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [title_en, title_fr || title_en, title_rw || title_en, url, icon, order_position || 0],
        function(err) {
            res.json({ success: !err });
        });
});

router.post('/top-bar/delete/:id', isAdmin, (req, res) => {
    db.run('DELETE FROM top_bar_links WHERE id = ?', [req.params.id], function(err) {
        res.json({ success: !err });
    });
});

// ==================== BREAKING NEWS ====================
router.get('/breaking-news', isAdmin, (req, res) => {
    db.all('SELECT * FROM breaking_news ORDER BY created_at DESC', (err, news) => {
        res.render('admin/dynamic/breaking-news', { 
            news: news || [],
            user: req.session.user,
            lang: req.lang || 'en'
        });
    });
});

router.post('/breaking-news/add', isAdmin, express.json(), (req, res) => {
    const { content_en, content_fr, content_rw, url, expires_at } = req.body;
    db.run(`INSERT INTO breaking_news (content_en, content_fr, content_rw, url, expires_at) 
            VALUES (?, ?, ?, ?, ?)`,
        [content_en, content_fr || content_en, content_rw || content_en, url, expires_at],
        function(err) {
            res.json({ success: !err });
        });
});

router.post('/breaking-news/delete/:id', isAdmin, (req, res) => {
    db.run('DELETE FROM breaking_news WHERE id = ?', [req.params.id], function(err) {
        res.json({ success: !err });
    });
});

// ==================== FEATURED ARTICLES ====================
router.get('/featured', isAdmin, (req, res) => {
    db.all(`SELECT f.*, n.title_en as article_title 
            FROM featured_articles f 
            LEFT JOIN news n ON f.article_id = n.id 
            ORDER BY f.order_position`, (err, featured) => {
        db.all('SELECT id, title_en FROM news WHERE status="published" ORDER BY created_at DESC LIMIT 20', (err, articles) => {
            res.render('admin/dynamic/featured', { 
                featured: featured || [],
                articles: articles || [],
                user: req.session.user,
                lang: req.lang || 'en'
            });
        });
    });
});

router.post('/featured/add', isAdmin, express.json(), (req, res) => {
    const { article_id, title_en, title_fr, title_rw, image_url, category, excerpt_en, excerpt_fr, excerpt_rw, order_position } = req.body;
    db.run(`INSERT INTO featured_articles (article_id, title_en, title_fr, title_rw, image_url, category, excerpt_en, excerpt_fr, excerpt_rw, order_position) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [article_id, title_en, title_fr || title_en, title_rw || title_en, image_url, category, excerpt_en, excerpt_fr || excerpt_en, excerpt_rw || excerpt_en, order_position || 0],
        function(err) {
            res.json({ success: !err });
        });
});

router.post('/featured/delete/:id', isAdmin, (req, res) => {
    db.run('DELETE FROM featured_articles WHERE id = ?', [req.params.id], function(err) {
        res.json({ success: !err });
    });
});

// ==================== FUN FACTS ====================
router.get('/fun-facts', isAdmin, (req, res) => {
    db.all('SELECT * FROM fun_facts ORDER BY order_position', (err, facts) => {
        res.render('admin/dynamic/fun-facts', { 
            facts: facts || [],
            user: req.session.user,
            lang: req.lang || 'en'
        });
    });
});

router.post('/fun-facts/add', isAdmin, express.json(), (req, res) => {
    const { fact_en, fact_fr, fact_rw, icon, order_position } = req.body;
    db.run(`INSERT INTO fun_facts (fact_en, fact_fr, fact_rw, icon, order_position) 
            VALUES (?, ?, ?, ?, ?)`,
        [fact_en, fact_fr || fact_en, fact_rw || fact_en, icon, order_position || 0],
        function(err) {
            res.json({ success: !err });
        });
});

router.post('/fun-facts/delete/:id', isAdmin, (req, res) => {
    db.run('DELETE FROM fun_facts WHERE id = ?', [req.params.id], function(err) {
        res.json({ success: !err });
    });
});

// ==================== SITE SETTINGS ====================
router.get('/settings', isAdmin, (req, res) => {
    db.all('SELECT * FROM site_settings ORDER BY setting_key', (err, settings) => {
        const settingsObj = {};
        settings.forEach(s => settingsObj[s.setting_key] = s.setting_value);
        res.render('admin/dynamic/settings', { 
            settings: settingsObj,
            user: req.session.user,
            lang: req.lang || 'en'
        });
    });
});

router.post('/settings/save', isAdmin, express.json(), (req, res) => {
    const settings = req.body;
    let completed = 0;
    const total = Object.keys(settings).length;
    
    if (total === 0) {
        return res.json({ success: true });
    }
    
    Object.keys(settings).forEach(key => {
        db.run(`INSERT OR REPLACE INTO site_settings (setting_key, setting_value) VALUES (?, ?)`,
            [key, settings[key]],
            function(err) {
                completed++;
                if (completed === total) {
                    res.json({ success: true });
                }
            });
    });
});

module.exports = router;
