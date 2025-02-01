import React, { useState, useEffect } from 'react';
import { getAllSerials, deleteSerial } from '../services/serial';

const SerialList = ({ onSelectSerial, onCreateSerial }) => {
    const [serials, setSerials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSerials();
    }, []);

    const fetchSerials = async () => {
        try {
            const data = await getAllSerials();
            setSerials(data);
            setError(null);
        } catch (err) {
            setError('獲取旅程序列失敗');
            console.error('Error fetching serials:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (serialId) => {
        if (window.confirm('確定要刪除這個旅程序列嗎？')) {
            try {
                await deleteSerial(serialId);
                setSerials(serials.filter(serial => serial.id !== serialId));
            } catch (err) {
                setError('刪除旅程序列失敗');
                console.error('Error deleting serial:', err);
            }
        }
    };

    if (loading) return <div className="p-4">載入中...</div>;
    if (error) return <div className="p-4 text-red-600">{error}</div>;

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">旅程序列</h2>
                <button
                    onClick={onCreateSerial}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    新建序列
                </button>
            </div>
            <div className="space-y-2">
                {serials.map(serial => (
                    <div
                        key={serial.id}
                        className="p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div 
                                className="flex items-center cursor-pointer"
                                onClick={() => onSelectSerial(serial)}
                            >
                                <div
                                    className="w-4 h-4 rounded-full mr-2"
                                    style={{ backgroundColor: serial.color }}
                                />
                                <div>
                                    <h3 className="font-medium">{serial.title}</h3>
                                    <p className="text-sm text-gray-500">
                                        {serial.marker_count} 個標記點
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(serial.id)}
                                className="text-red-600 hover:text-red-800"
                            >
                                刪除
                            </button>
                        </div>
                        {serial.description && (
                            <p className="mt-2 text-sm text-gray-600">
                                {serial.description}
                            </p>
                        )}
                    </div>
                ))}
                {serials.length === 0 && (
                    <p className="text-center text-gray-500">
                        還沒有創建任何旅程序列
                    </p>
                )}
            </div>
        </div>
    );
};

export default SerialList; 