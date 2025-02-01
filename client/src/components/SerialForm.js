import React, { useState, useEffect } from 'react';
import { createSerial, updateSerial } from '../services/serial';

const SerialForm = ({ serial, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        color: '#3B82F6',
        markerIds: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (serial) {
            setFormData({
                title: serial.title || '',
                description: serial.description || '',
                color: serial.color || '#3B82F6',
                markerIds: serial.markers?.map(m => m.id) || []
            });
        }
    }, [serial]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = serial
                ? await updateSerial(serial.id, formData)
                : await createSerial(formData);
            onSave(result);
        } catch (err) {
            setError(serial ? '更新序列失敗' : '創建序列失敗');
            console.error('Error saving serial:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    標題
                </label>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    描述
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    顏色
                </label>
                <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
            </div>

            {error && (
                <div className="text-red-600 text-sm">
                    {error}
                </div>
            )}

            <div className="flex justify-end space-x-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    disabled={loading}
                >
                    取消
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={loading}
                >
                    {loading ? '保存中...' : serial ? '更新' : '創建'}
                </button>
            </div>
        </form>
    );
};

export default SerialForm; 