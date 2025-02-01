import React, { useState, useEffect } from 'react';
import { createMarker, updateMarker } from '../services/markers';

const MarkerForm = ({ marker, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: marker?.title || '',
        description: marker?.description || '',
        date: marker?.date || new Date().toISOString().split('T')[0],
        tags: marker?.tags || [],
        latitude: marker?.latitude || 0,
        longitude: marker?.longitude || 0
    });
    const [error, setError] = useState('');
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (marker) {
            const date = marker.date ? new Date(marker.date) : new Date();
            const formattedDate = date.toISOString().split('T')[0];
            
            setFormData({
                ...marker,
                date: formattedDate,
                tags: marker.tags || []
            });
        }
    }, [marker]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 檢查標題是否為空
        if (!formData.title || !formData.title.trim()) {
            setError('標題為必填欄位');
            return;
        }

        try {
            const dataToSubmit = {
                ...formData,
                date: formData.date || new Date().toISOString().split('T')[0]
            };

            if (marker?.id) {
                await updateMarker(marker.id, dataToSubmit);
            } else {
                await createMarker(dataToSubmit);
            }
            onSave();
            onClose();
        } catch (error) {
            setError('保存標記點失敗');
            console.error('Error saving marker:', error);
        }
    };

    const handleTagAdd = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (!formData.tags.includes(newTag)) {
                setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, newTag]
                }));
            }
            setTagInput('');
        }
    };

    const handleTagDelete = (tagToDelete) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToDelete)
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
                <h2 className="text-xl font-bold mb-4">
                    {marker?.id ? '編輯標記點' : '創建新標記點'}
                </h2>
                
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="mb-4 text-red-600">{error}</div>
                    )}
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            標題 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="請輸入標題"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                            rows="3"
                            placeholder="請輸入描述"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">標籤</label>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {formData.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm flex items-center"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleTagDelete(tag)}
                                        className="ml-1 text-indigo-500 hover:text-indigo-700"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagAdd}
                            className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="輸入標籤後按 Enter"
                        />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MarkerForm; 