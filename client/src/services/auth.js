import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const authService = {
    async register(email, password) {
        const response = await axios.post(`${API_URL}/auth/register`, {
            email,
            password
        });
        return response.data;
    },

    async login(email, password) {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        if (response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    logout() {
        localStorage.removeItem('user');
    },

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('user'));
    }
}; 