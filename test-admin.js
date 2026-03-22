const axios = require('axios');

async function testAdmin() {
    try {
        // 1. Get login page to grab CSRF token & session cookio
        const loginRes = await axios.get('http://localhost:1000/admin/login');
        const cookie = loginRes.headers['set-cookie'][0].split(';')[0];

        // Match the csrf token
        const match = loginRes.data.match(/name="_csrf" value="([^"]+)"/);
        const csrfToken = match ? match[1] : '';

        // 2. Login
        const params = new URLSearchParams();
        params.append('username', 'admin');
        params.append('password', 'admin123');
        params.append('_csrf', csrfToken);

        const postRes = await axios.post('http://localhost:1000/admin/login', params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookie
            },
            maxRedirects: 0,
            validateStatus: s => s < 400
        });

        const authCookie = postRes.headers['set-cookie'] ? postRes.headers['set-cookie'][0].split(';')[0] : cookie;

        // 3. Fetch Comments
        const commentsRes = await axios.get('http://localhost:1000/admin/comments', {
            headers: { 'Cookie': authCookie },
            validateStatus: s => true
        });

        console.log('STATUS:', commentsRes.status);
        console.log('RESPONSE:', commentsRes.data);
    } catch (e) {
        console.error(e.message);
    }
}
testAdmin();
