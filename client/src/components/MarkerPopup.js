import React, { useState, useEffect } from 'react';
import PhotoUpload from './PhotoUpload';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const MarkerPopup = ({ marker, onDelete, onEdit }) => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                const response = await fetch(`${API_URL}/api/photos/${marker.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                setPhotos(data);
            } catch (error) {
                console.error('Error fetching photos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPhotos();
    }, [marker.id]);

    const handlePhotoUploaded = (newPhoto) => {
        setPhotos([...photos, newPhoto]);
    };

    const handleDeletePhoto = async (photoId) => {
        try {
            await fetch(`${API_URL}/api/photos/${photoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setPhotos(photos.filter(p => p.id !== photoId));
        } catch (error) {
            console.error('Error deleting photo:', error);
        }
    };

    const handleEditClick = (e) => {
        e.preventDefault();  // 防止事件冒泡和默認行為
        e.stopPropagation();
        onEdit(marker);
    };

    return (
        <div className="p-4">
            <h3 className="font-bold text-lg mb-2">{marker.title}</h3>
            <p className="mb-2">{marker.description}</p>
            <p className="mb-2">天氣: {marker.weather}</p>
            <p className="mb-2">日期: {new Date(marker.date).toLocaleDateString('zh-TW')}</p>
            
            {marker.tags && marker.tags.length > 0 && (
                <div className="mb-4">
                    <h4 className="font-bold mb-1">標籤</h4>
                    <div className="flex flex-wrap gap-1">
                        {marker.tags.map(tag => (
                            <span
                                key={tag}
                                className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="flex justify-end space-x-2">
                <button
                    onClick={handleEditClick}
                    className="text-indigo-600 hover:text-indigo-800"
                >
                    編輯
                </button>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(marker.id);
                    }}
                    className="text-red-600 hover:text-red-800"
                >
                    刪除
                </button>
            </div>

            <div className="mb-4">
                <h4 className="font-bold mb-2">照片</h4>
                {loading ? (
                    <p>載入中...</p>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {photos.map(photo => (
                            <div key={photo.id} className="relative">
                                <img
                                    src={`${API_URL}${photo.photo_url}`}
                                    alt="標記點照片"
                                    className="w-full h-32 object-cover rounded"
                                />
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeletePhoto(photo.id);
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <PhotoUpload markerId={marker.id} onPhotoUploaded={handlePhotoUploaded} />
        </div>
    );
};

export default MarkerPopup; 