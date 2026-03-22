module.exports = {
    apps: [{
        name: 'onnieone-news',
        script: './app.js',
        instances: 'max', // Scale across all available CPU cores
        exec_mode: 'cluster',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 1000
        },
        log_date_format: 'YYYY-MM-DD HH:mm Z',
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log'
    }]
};
