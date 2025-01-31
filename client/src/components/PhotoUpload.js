import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const PhotoUpload = ({ markerId, onPhotoUploaded }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('photo', selectedFile);

        setUploading(true);
        try {
            const response = await fetch(`${API_URL}/api/photos/${markerId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('上傳失敗');
            }

            const data = await response.json();
            onPhotoUploaded(data);
            setSelectedFile(null);
        } catch (error) {
            console.error('Error uploading photo:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="mt-4">
            <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mb-2"
            />
            <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className={`w-full p-2 rounded text-white ${
                    !selectedFile || uploading
                        ? 'bg-gray-400'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
            >
                {uploading ? '上傳中...' : '上傳照片'}
            </button>
        </div>
    );
};

export default PhotoUpload; 