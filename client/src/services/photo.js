import axios from 'axios';
import { authHeader } from '../utils/auth-header';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const photoService = {
    async uploadPhoto(markerId, file) {
        const formData = new FormData();
        formData.append('photo', file);
        
        const response = await axios.post(
            `${API_URL}/photos/${markerId}`,
            formData,
            {
                headers: {
                    ...authHeader(),
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        return response.data;
    },

    async deletePhoto(photoId) {
        const response = await axios.delete(`${API_URL}/photos/${photoId}`, {
            headers: authHeader()
        });
        return response.data;
    }
}; 