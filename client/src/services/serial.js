const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// 獲取所有序列
export const getAllSerials = async () => {
    try {
        const response = await fetch(`${API_URL}/api/serials`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('獲取序列失敗');
        return await response.json();
    } catch (error) {
        console.error('Error fetching serials:', error);
        throw error;
    }
};

// 獲取單個序列詳情
export const getSerialById = async (id) => {
    try {
        const response = await fetch(`${API_URL}/api/serials/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('獲取序列詳情失敗');
        return await response.json();
    } catch (error) {
        console.error('Error fetching serial details:', error);
        throw error;
    }
};

// 創建新序列
export const createSerial = async (serialData) => {
    try {
        const response = await fetch(`${API_URL}/api/serials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(serialData)
        });
        if (!response.ok) throw new Error('創建序列失敗');
        return await response.json();
    } catch (error) {
        console.error('Error creating serial:', error);
        throw error;
    }
};

// 更新序列
export const updateSerial = async (id, serialData) => {
    try {
        const response = await fetch(`${API_URL}/api/serials/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(serialData)
        });
        if (!response.ok) throw new Error('更新序列失敗');
        return await response.json();
    } catch (error) {
        console.error('Error updating serial:', error);
        throw error;
    }
};

// 刪除序列
export const deleteSerial = async (id) => {
    try {
        const response = await fetch(`${API_URL}/api/serials/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('刪除序列失敗');
        return await response.json();
    } catch (error) {
        console.error('Error deleting serial:', error);
        throw error;
    }
}; 