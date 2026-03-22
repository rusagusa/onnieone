const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const axios = require('axios');
const cheerio = require('cheerio');

const db = new sqlite3.Database('./data/news.db');

// Multer configuration
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
        cb(null, ext && mime);
    }
});

// Auth middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.user) next();
    else res.redirect('/admin/login');
};

// Admin login page
router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/admin/dashboard');
    res.render('admin/login', { error: null, lang: 'en' });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const bcrypt = require('bcrypt');
    
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.user = user;
            res.redirect('/admin/dashboard');
        } else {
            res.render('admin/login', { error: 'Invalid username or password', lang: 'en' });
        }
    });
});

// Admin logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
    // Get all stats in parallel
    db.get(`SELECT COUNT(*) as total FROM news`, (err, totalNews) => {
        db.get(`SELECT COUNT(*) as total FROM news WHERE is_trending = 1`, (err, trendingNews) => {
            db.get(`SELECT SUM(views) as total FROM news`, (err, totalViews) => {
                db.get(`SELECT COUNT(*) as total FROM comments WHERE is_approved = 0`, (err, pendingComments) => {
                    
                    const stats = {
                        totalNews: totalNews?.total || 0,
                        trendingNews: trendingNews?.total || 0,
                        totalViews: totalViews?.total || 0,
                        pendingComments: pendingComments?.total || 0
                    };
                    
                    db.all(`SELECT n.*, c.name_en as category_name 
                            FROM news n 
                            LEFT JOIN categories c ON n.category_id = c.id 
                            ORDER BY n.created_at DESC LIMIT 10`, (err, recentNews) => {
                        
                        db.all(`SELECT * FROM news WHERE is_trending = 1 ORDER BY trending_score DESC LIMIT 5`, (err, trendingNewsList) => {
                            res.render('admin/dashboard', {
                                user: req.session.user,
                                stats: stats,
                                recentNews: recentNews || [],
                                trendingNews: trendingNewsList || [],
                                lang: 'en'
                            });
                        });
                    });
                });
            });
        });
    });
});

// News management
router.get('/news', isAuthenticated, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    db.all(`SELECT n.*, c.name_en as category_name, r.name_en as region_name 
            FROM news n 
            LEFT JOIN categories c ON n.category_id = c.id 
            LEFT JOIN regions r ON n.region_id = r.id 
            ORDER BY n.created_at DESC 
            LIMIT ? OFFSET ?`, [limit, offset], (err, news) => {
        
        db.get(`SELECT COUNT(*) as total FROM news`, (err, count) => {
            res.render('admin/news-list', {
                user: req.session.user,
                news: news || [],
                currentPage: page,
                totalPages: Math.ceil((count?.total || 0) / limit),
                lang: 'en'
            });
        });
    });
});

// Add news page
router.get('/news/add', isAuthenticated, (req, res) => {
    db.all(`SELECT * FROM categories ORDER BY name_en`, (err, categories) => {
        db.all(`SELECT * FROM regions ORDER BY name_en`, (err, regions) => {
            res.render('admin/add-news', {
                user: req.session.user,
                categories: categories || [],
                regions: regions || [],
                error: req.query.error || null,
                success: req.query.success || null,
                lang: 'en'
            });
        });
    });
});

// Create news
router.post('/news/add', isAuthenticated, upload.single('image'), (req, res) => {
    const { 
        title_en, 
        content_en,
        summary_en,
        category_id, 
        region_id,
        source_name, 
        source_url, 
        author,
        is_trending, 
        credit_text
    } = req.body;

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const image_credit = req.body.image_credit || source_name || 'ONNIEONE';

    db.run(`INSERT INTO news (
        title_en, content_en, summary_en,
        category_id, region_id,
        image_url, image_credit,
        source_name, source_url, author,
        author_id, is_trending, 
        credit_text, status,
        published_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'), datetime('now'), datetime('now'))`,
    [
        title_en, 
        content_en, 
        summary_en || title_en,
        category_id, 
        region_id,
        image_url, 
        image_credit,
        source_name, 
        source_url, 
        author || req.session.user.username,
        req.session.user.id,
        is_trending ? 1 : 0,
        credit_text || `Source: ${source_name || 'ONNIEONE News'}`
    ],
    function(err) {
        if (err) {
            console.error(err);
            res.redirect('/admin/news/add?error=Failed to add news');
        } else {
            res.redirect('/admin/dashboard?success=News added successfully');
        }
    });
});

// Edit news page
router.get('/news/edit/:id', isAuthenticated, (req, res) => {
    const id = req.params.id;
    
    db.get(`SELECT * FROM news WHERE id = ?`, [id], (err, article) => {
        if (!article) return res.redirect('/admin/news');
        
        db.all(`SELECT * FROM categories ORDER BY name_en`, (err, categories) => {
            db.all(`SELECT * FROM regions ORDER BY name_en`, (err, regions) => {
                res.render('admin/edit-news', {
                    user: req.session.user,
                    article,
                    categories: categories || [],
                    regions: regions || [],
                    error: null,
                    success: null,
                    lang: 'en'
                });
            });
        });
    });
});

// Update news
router.post('/news/edit/:id', isAuthenticated, upload.single('image'), (req, res) => {
    const id = req.params.id;
    const {
        title_en, content_en, summary_en,
        category_id, region_id,
        source_name, source_url, author,
        is_trending, status, credit_text
    } = req.body;

    let query = `UPDATE news SET 
        title_en = ?, content_en = ?, summary_en = ?,
        category_id = ?, region_id = ?,
        source_name = ?, source_url = ?, author = ?,
        is_trending = ?, status = ?, credit_text = ?, updated_at = datetime('now')
    `;
    
    const params = [
        title_en, content_en, summary_en,
        category_id, region_id,
        source_name, source_url, author,
        is_trending ? 1 : 0, status, credit_text
    ];

    if (req.file) {
        query += `, image_url = ?`;
        params.push(`/uploads/${req.file.filename}`);
    }

    params.push(id);
    query += ` WHERE id = ?`;

    db.run(query, params, (err) => {
        if (err) {
            console.error(err);
            res.redirect(`/admin/news/edit/${id}?error=Failed to update news`);
        } else {
            res.redirect('/admin/news?success=News updated successfully');
        }
    });
});

// Delete news
router.post('/news/delete/:id', isAuthenticated, (req, res) => {
    db.run(`DELETE FROM news WHERE id = ?`, [req.params.id], (err) => {
        res.redirect('/admin/news?success=News deleted successfully');
    });
});

// Categories management
router.get('/categories', isAuthenticated, (req, res) => {
    db.all(`SELECT c.*, COUNT(n.id) as news_count 
            FROM categories c 
            LEFT JOIN news n ON c.id = n.category_id 
            GROUP BY c.id ORDER BY c.name_en`, (err, categories) => {
        res.render('admin/categories', {
            user: req.session.user,
            categories: categories || [],
            lang: 'en'
        });
    });
});

// Regions management
router.get('/regions', isAuthenticated, (req, res) => {
    db.all(`SELECT r.*, COUNT(n.id) as news_count 
            FROM regions r 
            LEFT JOIN news n ON r.id = n.region_id 
            GROUP BY r.id ORDER BY r.name_en`, (err, regions) => {
        res.render('admin/regions', {
            user: req.session.user,
            regions: regions || [],
            lang: 'en'
        });
    });
});

// Media library
router.get('/media', isAuthenticated, (req, res) => {
    db.all(`SELECT * FROM media ORDER BY created_at DESC`, (err, media) => {
        res.render('admin/media', {
            user: req.session.user,
            media: media || [],
            lang: 'en'
        });
    });
});

// Upload media
router.post('/media/upload', isAuthenticated, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    db.run(`INSERT INTO media (filename, original_name, path, type, size, uploaded_by) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [req.file.filename, req.file.originalname, `/uploads/${req.file.filename}`, 
         req.file.mimetype, req.file.size, req.session.user.id],
        (err) => {
            res.redirect('/admin/media');
        }
    );
});

// Delete media
router.post('/media/delete/:id', isAuthenticated, (req, res) => {
    db.get(`SELECT * FROM media WHERE id = ?`, [req.params.id], (err, media) => {
        if (media) {
            const filePath = path.join(__dirname, '../public', media.path);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            db.run(`DELETE FROM media WHERE id = ?`, [req.params.id]);
        }
        res.redirect('/admin/media');
    });
});

// Trending search
router.get('/trending-search', isAuthenticated, (req, res) => {
    res.render('admin/trending-search', {
        user: req.session.user,
        results: null,
        error: req.query.error || null,
        success: req.query.success || null,
        keyword: '',
        source: 'all',
        lang: 'en'
    });
});

router.post('/trending-search', isAuthenticated, async (req, res) => {
    const { keyword, source } = req.body;
    const NewsScraper = require('../scrapers/news-scraper');
    
    try {
        let results = [];
        
        if (source === 'bbc' || source === 'all') {
            const bbc = await NewsScraper.scrapeBBC(keyword);
            results = [...results, ...bbc];
        }
        if (source === 'aljazeera' || source === 'all') {
            const aj = await NewsScraper.scrapeAlJazeera(keyword);
            results = [...results, ...aj];
        }
        if (source === 'newtimes' || source === 'all') {
            const nt = await NewsScraper.scrapeNewTimes(keyword);
            results = [...results, ...nt];
        }
        if (source === 'africanews' || source === 'all') {
            const af = await NewsScraper.scrapeAfricaNews(keyword);
            results = [...results, ...af];
        }
        
        const seen = new Set();
        results = results.filter(article => {
            const duplicate = seen.has(article.title);
            seen.add(article.title);
            return !duplicate;
        });
        
        db.all(`SELECT * FROM categories`, (err, categories) => {
            db.all(`SELECT * FROM regions`, (err, regions) => {
                res.render('admin/trending-search', {
                    user: req.session.user,
                    results,
                    error: null,
                    success: null,
                    keyword,
                    source,
                    categories: categories || [],
                    regions: regions || [],
                    lang: 'en'
                });
            });
        });
    } catch (error) {
        console.error('Search error:', error);
        res.redirect('/admin/trending-search?error=Failed to fetch news');
    }
});

router.post('/import-article', isAuthenticated, (req, res) => {
    const { title, link, summary, image, source } = req.body;
    
    const creditText = `Originally published by ${source}. Imported by ONNIEONE News with full credit attribution. Original article: ${link}`;
    
    db.get(`SELECT id FROM categories WHERE slug = ?`, ['news'], (err, cat) => {
        db.get(`SELECT id FROM regions WHERE slug = ?`, ['international'], (err, reg) => {
            db.run(`INSERT INTO news (
                title_en, content_en, summary_en,
                category_id, region_id,
                image_url, image_credit,
                source_name, source_url,
                author, author_id,
                credit_text, status,
                published_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'), datetime('now'), datetime('now'))`,
            [
                title, 
                summary || title, 
                summary || title,
                cat?.id || 1, 
                reg?.id || 6,
                image || null, 
                source,
                source, 
                link,
                source, 
                req.session.user.id,
                creditText
            ], function(err) {
                if (err) {
                    console.error(err);
                    res.redirect('/admin/trending-search?error=Failed to import article');
                } else {
                    res.redirect('/admin/trending-search?success=Article imported successfully');
                }
            });
        });
    });
});

module.exports = router;
