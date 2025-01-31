import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testAuth() {
    try {
        // 測試註冊
        console.log('Testing registration...');
        const registerResponse = await axios.post(`${API_URL}/auth/register`, {
            email: 'test@example.com',
            password: 'password123'
        });
        console.log('Registration response:', registerResponse.data);

        // 測試登入
        console.log('\nTesting login...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'test@example.com',
            password: 'password123'
        });
        console.log('Login response:', loginResponse.data);

        // 保存 token
        const token = loginResponse.data.token;

        // 測試受保護的路由
        console.log('\nTesting protected route...');
        const markersResponse = await axios.get(`${API_URL}/markers`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Protected route response:', markersResponse.data);

    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

testAuth(); 