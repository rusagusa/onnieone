// Language middleware for multilingual support
module.exports = (req, res, next) => {
    // Get language from query parameter, session, or default to 'en'
    const lang = req.query.lang || req.session?.lang || 'en';
    
    // Validate language
    const validLangs = ['en', 'fr', 'rw'];
    req.lang = validLangs.includes(lang) ? lang : 'en';
    
    // Store in session if session exists
    if (req.session) {
        req.session.lang = req.lang;
    }
    
    // Make language and translation function available to all views
    res.locals.lang = req.lang;
    res.locals.t = (en, fr, rw) => {
        if (req.lang === 'fr') return fr || en;
        if (req.lang === 'rw') return rw || en;
        return en;
    };
    
    next();
};
