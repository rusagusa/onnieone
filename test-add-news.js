const axios = require('axios');

async function testAddNews() {
    try {
        const loginRes = await axios.get('http://localhost:1000/admin/login');
        const cookie = loginRes.headers['set-cookie'][0].split(';')[0];

        const match = loginRes.data.match(/name="_csrf" value="([^"]+)"/);
        const csrfToken = match ? match[1] : '';

        const params = new URLSearchParams();
        params.append('username', 'admin');
        params.append('password', 'admin123');
        params.append('_csrf', csrfToken);

        const postRes = await axios.post('http://localhost:1000/admin/login', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookie },
            maxRedirects: 0,
            validateStatus: s => true
        });

        const authCookie = postRes.headers['set-cookie'] ? postRes.headers['set-cookie'][0].split(';')[0] : cookie;

        const res = await axios.get('http://localhost:1000/admin/news/add', {
            headers: { 'Cookie': authCookie },
            validateStatus: s => true
        });

        console.log('STATUS:', res.status);
        if (res.status === 500) {
            console.log(res.data);
        } else {
            console.log("SUCCESS!");
        }
    } catch (e) {
        console.error(e.message);
    }
}
testAddNews();
