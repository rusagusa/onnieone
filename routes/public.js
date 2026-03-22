const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Homepage
router.get('/', (req, res, next) => {
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
            if (err) return next(err); // Central error handling
            results[key] = data || [];
            completed++;

            if (completed === total) {
                const settingsObj = {};
                results.settings.forEach(s => settingsObj[s.setting_key] = s.setting_value);

                res.render('index-final', {
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
                    user: req.session ? req.session.user : null
                });
            }
        });
    });
});

// Article page
router.get('/article/:id', (req, res, next) => {
    const id = req.params.id;

    db.run('UPDATE articles SET views = views + 1 WHERE id = ?', [id]);

    db.get(`SELECT a.*, c.name_en as category_name 
            FROM articles a 
            LEFT JOIN categories c ON a.category_id = c.id 
            WHERE a.id = ?`, [id], (err, article) => {

        if (err) return next(err);
        if (!article) {
            const error = new Error('Article not found');
            error.status = 404;
            return next(error);
        }

        db.all(`SELECT * FROM articles 
                WHERE category_id = ? AND id != ? AND status = 'published'
                ORDER BY published_at DESC LIMIT 4`, [article.category_id, id], (err, related) => {
            if (err) return next(err);

            db.all('SELECT * FROM categories WHERE is_active = 1 ORDER BY order_position', (err, categories) => {
                if (err) return next(err);

                db.all('SELECT * FROM site_settings', (err, settings) => {
                    if (err) return next(err);

                    const settingsObj = {};
                    settings.forEach(s => settingsObj[s.setting_key] = s.setting_value);

                    res.render('article', {
                        article: article,
                        related: related || [],
                        categories: categories || [],
                        settings: settingsObj,
                        user: req.session ? req.session.user : null
                    });
                });
            });
        });
    });
});

// Category page
router.get('/category/:slug', (req, res, next) => {
    const slug = req.params.slug;

    db.get('SELECT * FROM categories WHERE slug = ?', [slug], (err, category) => {
        if (err) return next(err);
        if (!category) return res.redirect('/');

        db.all(`SELECT a.*, c.name_en as category_name 
                FROM articles a 
                LEFT JOIN categories c ON a.category_id = c.id 
                WHERE c.slug = ? AND a.status = 'published'
                ORDER BY a.published_at DESC`, [slug], (err, articles) => {
            if (err) return next(err);

            res.render('category', {
                category: category,
                articles: articles || []
            });
        });
    });
});

// Search - fixed operator precedence SQL injection vulnerability
router.get('/search', (req, res, next) => {
    const query = req.query.q;
    if (!query) return res.redirect('/');

    db.all(`SELECT a.*, c.name_en as category_name 
            FROM articles a 
            LEFT JOIN categories c ON a.category_id = c.id 
            WHERE (a.title_en LIKE ? OR a.content_en LIKE ?)
            AND a.status = 'published'
            ORDER BY a.published_at DESC`,
        [`%${query}%`, `%${query}%`],
        (err, results) => {

            if (err) return next(err);

            res.render('search', {
                query: query,
                results: results || []
            });
        });
});

// Sitemap XML
router.get('/sitemap.xml', (req, res, next) => {
    db.all(`SELECT id, updated_at, published_at FROM articles WHERE status = 'published' ORDER BY published_at DESC LIMIT 1000`, (err, articles) => {
        if (err) return next(err);

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n';

        // Homepage
        xml += '  <url>\\n    <loc>https://onnieone.com/</loc>\\n    <changefreq>hourly</changefreq>\\n    <priority>1.0</priority>\\n  </url>\\n';

        // Articles
        articles.forEach(a => {
            const date = (a.updated_at || a.published_at || new Date().toISOString()).split('T')[0];
            xml += `  <url>\\n    <loc>https://onnieone.com/article/${a.id}</loc>\\n    <lastmod>${date}</lastmod>\\n    <changefreq>daily</changefreq>\\n    <priority>0.8</priority>\\n  </url>\\n`;
        });

        xml += '</urlset>';
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    });
});

// RSS Feed
router.get('/rss.xml', (req, res, next) => {
    db.all(`SELECT a.*, c.name_en as category_name 
            FROM articles a 
            LEFT JOIN categories c ON a.category_id = c.id 
            WHERE a.status = 'published' ORDER BY a.published_at DESC LIMIT 20`, (err, articles) => {
        if (err) return next(err);

        let xml = '<?xml version="1.0" encoding="UTF-8" ?>\\n';
        xml += '<rss version="2.0">\\n<channel>\\n';
        xml += '  <title>ONNIEONE NEWS</title>\\n';
        xml += '  <link>https://onnieone.com</link>\\n';
        xml += '  <description>Latest news and updates from Rwanda</description>\\n';

        articles.forEach(a => {
            const date = new Date(a.published_at || Date.now()).toUTCString();
            xml += `  <item>\\n`;
            xml += `    <title><![CDATA[${a.title_en}]]></title>\\n`;
            xml += `    <link>https://onnieone.com/article/${a.id}</link>\\n`;
            xml += `    <description><![CDATA[${a.summary_en || a.content_en.substring(0, 150)}...]]></description>\\n`;
            xml += `    <category>${a.category_name || 'News'}</category>\\n`;
            xml += `    <pubDate>${date}</pubDate>\\n`;
            xml += `  </item>\\n`;
        });

        xml += '</channel>\\n</rss>';
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    });
});

module.exports = router;
