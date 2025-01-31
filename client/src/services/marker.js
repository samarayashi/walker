import axios from 'axios';
import { authHeader } from '../utils/auth-header';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const markerService = {
    async createMarker(markerData) {
        const response = await axios.post(`${API_URL}/markers`, markerData, {
            headers: authHeader()
        });
        return response.data;
    },

    async getMarkers() {
        const response = await axios.get(`${API_URL}/markers`, {
            headers: authHeader()
        });
        return response.data;
    },

    async updateMarker(id, markerData) {
        const response = await axios.put(`${API_URL}/markers/${id}`, markerData, {
            headers: authHeader()
        });
        return response.data;
    },

    async deleteMarker(id) {
        const response = await axios.delete(`${API_URL}/markers/${id}`, {
            headers: authHeader()
        });
        return response.data;
    }
}; 