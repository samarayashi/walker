import React, { useState, useEffect } from 'react';
import { createSerial, updateSerial, deleteSerial } from '../services/serial';

const SerialManager = ({ 
    isOpen, 
    onClose, 
    selectedMarkers = [], 
    onSerialCreated,
    editingSerial = null 
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#3B82F6');
    const [error, setError] = useState('');

    useEffect(() => {
        if (editingSerial) {
            setName(editingSerial.name);
            setDescription(editingSerial.description || '');
            setColor(editingSerial.color);
        }
    }, [editingSerial]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('請輸入序列名稱');
            return;
        }

        if (selectedMarkers.length < 2) {
            setError('請至少選擇兩個標記點');
            return;
        }

        try {
            const serialData = {
                name,
                description,
                color,
                markers: selectedMarkers.map(marker => marker.id)
            };

            if (editingSerial) {
                await updateSerial(editingSerial.id, serialData);
            } else {
                await createSerial(serialData);
            }

            onSerialCreated();
            resetForm();
            onClose();
        } catch (error) {
            setError('保存序列失敗');
            console.error('Error saving serial:', error);
        }
    };

    const handleDelete = async () => {
        if (!editingSerial) return;

        try {
            await deleteSerial(editingSerial.id);
            onSerialCreated();
            onClose();
        } catch (error) {
            setError('刪除序列失敗');
            console.error('Error deleting serial:', error);
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setColor('#3B82F6');
        setError('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
                <h2 className="text-xl font-bold mb-4">
                    {editingSerial ? '編輯序列' : '創建新序列'}
                </h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            名稱
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="輸入序列名稱"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            描述
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="輸入序列描述"
                            rows="3"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            顏色
                        </label>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-full p-1 border rounded h-10"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            已選擇的標記點
                        </label>
                        <div className="text-sm text-gray-600">
                            {selectedMarkers.length} 個標記點
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end space-x-2">
                        {editingSerial && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                刪除
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            {editingSerial ? '更新' : '創建'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SerialManager; 