const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// 獲取所有標記點
export const getAllMarkers = async () => {
    try {
        const response = await fetch(`${API_URL}/api/markers`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('獲取標記點失敗');
        return await response.json();
    } catch (error) {
        console.error('Error fetching markers:', error);
        throw error;
    }
};

// 創建新標記點
export const createMarker = async (markerData) => {
    try {
        const response = await fetch(`${API_URL}/api/markers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(markerData)
        });
        if (!response.ok) throw new Error('創建標記點失敗');
        return await response.json();
    } catch (error) {
        console.error('Error creating marker:', error);
        throw error;
    }
};

// 更新標記點
export const updateMarker = async (id, markerData) => {
    try {
        const response = await fetch(`${API_URL}/api/markers/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(markerData)
        });
        if (!response.ok) throw new Error('更新標記點失敗');
        return await response.json();
    } catch (error) {
        console.error('Error updating marker:', error);
        throw error;
    }
};

// 刪除標記點
export const deleteMarker = async (id) => {
    try {
        const response = await fetch(`${API_URL}/api/markers/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('刪除標記點失敗');
        return await response.json();
    } catch (error) {
        console.error('Error deleting marker:', error);
        throw error;
    }
}; 