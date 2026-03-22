const axios = require('axios');

async function testLiveEdit() {
    try {
        console.log('1. Fetching login page...');
        const loginRes = await axios.get('http://localhost:1000/admin/login');
        const cookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0].split(';')[0] : '';
        console.log('   Cookie:', cookie);

        // More robust CSRF extraction
        const match = loginRes.data.match(/name="_csrf"[\s\S]*?value="([^"]+)"/) ||
            loginRes.data.match(/value="([^"]+)"[\s\S]*?name="_csrf"/);

        const csrfToken = match ? match[1] : '';
        console.log('   CSRF Token:', csrfToken);

        if (!csrfToken) {
            console.log('   DEBUG: Login Page HTML snippet:', loginRes.data.substring(loginRes.data.indexOf('name="_csrf"'), loginRes.data.indexOf('name="_csrf"') + 100));
        }

        const params = new URLSearchParams();
        params.append('username', 'admin');
        params.append('password', 'admin123');
        params.append('_csrf', csrfToken);

        console.log('2. Logging in...');
        const postRes = await axios.post('http://localhost:1000/admin/login', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookie },
            maxRedirects: 0,
            validateStatus: s => true
        });

        console.log('   Status:', postRes.status);
        const authCookie = postRes.headers['set-cookie'] ? postRes.headers['set-cookie'][0].split(';')[0] : cookie;
        console.log('   Auth Cookie:', authCookie);

        // 3. Test Live Edit Text
        console.log('3. Sending Live Edit request...');
        const testPayload = {
            type: 'site_setting',
            key: 'site_name',
            field: 'setting_value',
            value: 'ONNIEONE NEWS - UPDATED ' + new Date().getTime()
        };

        const editRes = await axios.post('http://localhost:1000/admin/api/live-edit/text', testPayload, {
            headers: {
                'CSRF-Token': csrfToken,
                'Cookie': authCookie,
                'Content-Type': 'application/json'
            }
        });

        console.log('   Edit Response:', editRes.data);

        // 4. Verify on Homepage
        console.log('4. Verifying on Homepage...');
        const homeRes = await axios.get('http://localhost:1000/');
        if (homeRes.data.includes(testPayload.value)) {
            console.log('   VERIFICATION SUCCESS: Changes reflected on homepage!');
        } else {
            console.log('   VERIFICATION FAILED: Changes not found on homepage.');
        }

    } catch (e) {
        console.error('TEST ERROR:', e.response ? e.response.status : 'No response', e.message);
        if (e.response) console.log(e.response.data);
    }
}

testLiveEdit();
