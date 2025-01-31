import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import MarkerPopup from './MarkerPopup';
import DateFilter from './DateFilter';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// 修復 Leaflet 默認圖標問題
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// 地圖點擊事件處理組件
const MapEvents = ({ onMapClick }) => {
    useMapEvents({
        click: (e) => {
            onMapClick(e);
        },
    });
    return null;
};

const Map = () => {
    const [markers, setMarkers] = useState([]);
    const [filteredMarkers, setFilteredMarkers] = useState([]);
    const [newMarker, setNewMarker] = useState(null);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [editingMarker, setEditingMarker] = useState(null);
    const mapRef = useRef(null);
    const markerRefs = useRef({});  // 新增：用於存儲標記點的引用
    const [sortDirection, setSortDirection] = useState('desc'); // 'desc' 為由近到遠，'asc' 為由遠到近
    const [allTags, setAllTags] = useState(new Set()); // 存儲所有使用過的標籤
    
    // 處理排序
    const sortMarkers = (markers, direction) => {
        return [...markers].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return direction === 'desc' ? dateB - dateA : dateA - dateB;
        });
    };

    // 更新所有標籤的函數
    const updateAllTags = (markers) => {
        const tags = new Set();
        markers.forEach(marker => {
            if (marker.tags) {
                marker.tags.forEach(tag => tags.add(tag));
            }
        });
        setAllTags(tags);
    };

    // 修改獲取標記點的 useEffect
    useEffect(() => {
        const fetchMarkers = async () => {
            try {
                const response = await fetch(`${API_URL}/api/markers`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                const sortedData = sortMarkers(data, sortDirection);
                setMarkers(sortedData);
                setFilteredMarkers(sortedData);
                updateAllTags(sortedData);
            } catch (error) {
                console.error('Error fetching markers:', error);
            }
        };
        
        fetchMarkers();
    }, [sortDirection]);

    // 修改搜索和篩選的 useEffect
    useEffect(() => {
        let filtered = markers;
        
        // 搜索詞篩選
        if (searchTerm) {
            filtered = filtered.filter(marker => 
                marker.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                marker.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                marker.weather?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                marker.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        // 日期區間篩選
        if (startDate || endDate) {
            filtered = filtered.filter(marker => {
                const markerDate = new Date(marker.date);
                markerDate.setHours(0, 0, 0, 0);

                if (startDate && endDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    return markerDate >= start && markerDate <= end;
                } else if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    return markerDate >= start;
                } else if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    return markerDate <= end;
                }
                return true;
            });
        }

        // 套用排序
        filtered = sortMarkers(filtered, sortDirection);
        setFilteredMarkers(filtered);
    }, [searchTerm, startDate, endDate, markers, sortDirection]);
    
    // 添加新標記點
    const handleMapClick = (e) => {
        setNewMarker({
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
            title: '',
            description: '',
            weather: '',
            date: new Date().toISOString().split('T')[0],
            tags: []
        });
    };
    
    // 保存新標記點
    const handleSaveMarker = async () => {
        try {
            const response = await fetch(`${API_URL}/api/markers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newMarker)
            });
            
            const data = await response.json();
            const newMarkerWithId = { ...newMarker, id: data.markerId };
            setMarkers([...markers, newMarkerWithId]);
            setFilteredMarkers([...filteredMarkers, newMarkerWithId]);
            setNewMarker(null);
        } catch (error) {
            console.error('Error saving marker:', error);
        }
    };

    // 刪除標記點
    const handleDeleteMarker = async (markerId) => {
        try {
            await fetch(`${API_URL}/api/markers/${markerId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const updatedMarkers = markers.filter(m => m.id !== markerId);
            setMarkers(updatedMarkers);
            setFilteredMarkers(updatedMarkers);
        } catch (error) {
            console.error('Error deleting marker:', error);
        }
    };

    // 處理登出
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // 處理標記點編輯
    const handleEditMarker = async (markerId, updatedData) => {
        try {
            // 確保日期格式正確
            const dataToUpdate = {
                ...updatedData,
                date: new Date(updatedData.date).toISOString().split('T')[0] // 轉換為 YYYY-MM-DD 格式
            };

            const response = await fetch(`${API_URL}/api/markers/${markerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(dataToUpdate)
            });

            if (response.ok) {
                const updatedMarkers = markers.map(marker => 
                    marker.id === markerId ? { ...marker, ...dataToUpdate } : marker
                );
                setMarkers(updatedMarkers);
                setFilteredMarkers(updatedMarkers);
                setEditingMarker(null);
            } else {
                console.error('Failed to update marker');
            }
        } catch (error) {
            console.error('Error updating marker:', error);
        }
    };

    // 處理側邊欄標記點點擊
    const handleSidebarMarkerClick = (marker) => {
        setEditingMarker(null); // 重置編輯狀態
        setSelectedMarker(marker);
        // 將地圖視圖移動到標記點位置
        if (mapRef.current) {
            const map = mapRef.current;
            map.setView([marker.latitude, marker.longitude], 15);
            // 打開標記點的彈出窗口
            const markerRef = markerRefs.current[marker.id];
            if (markerRef) {
                markerRef.openPopup();
            }
        }
    };

    // 處理編輯按鈕點擊
    const handleEditClick = (marker) => {
        // 確保所有資料都被正確複製
        const markerToEdit = {
            ...marker,
            date: new Date(marker.date).toISOString().split('T')[0] // 轉換日期格式為 YYYY-MM-DD
        };
        setEditingMarker(markerToEdit);
        setSelectedMarker(marker);
        // 將地圖視圖移動到標記點位置
        if (mapRef.current) {
            const map = mapRef.current;
            map.setView([marker.latitude, marker.longitude], 15);
            // 打開標記點的彈出窗口
            const markerRef = markerRefs.current[marker.id];
            if (markerRef) {
                markerRef.openPopup();
            }
        }
    };

    // 處理標籤輸入
    const handleTagInput = (e, marker, setMarker) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            const newTag = e.target.value.trim();
            const updatedTags = [...(marker.tags || [])];
            if (!updatedTags.includes(newTag)) {
                updatedTags.push(newTag);
                setMarker({
                    ...marker,
                    tags: updatedTags
                });
            }
            e.target.value = '';
        }
    };

    // 處理標籤刪除
    const handleTagDelete = (tagToDelete, marker, setMarker) => {
        const updatedTags = (marker.tags || []).filter(tag => tag !== tagToDelete);
        setMarker({
            ...marker,
            tags: updatedTags
        });
    };

    // 渲染標籤輸入和顯示組件
    const TagsInput = ({ marker, setMarker }) => (
        <div className="mb-2">
            <div className="flex flex-wrap gap-1 mb-1">
                {(marker.tags || []).map(tag => (
                    <span
                        key={tag}
                        className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm flex items-center"
                    >
                        {tag}
                        <button
                            onClick={() => handleTagDelete(tag, marker, setMarker)}
                            className="ml-1 text-indigo-500 hover:text-indigo-700"
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>
            <input
                type="text"
                placeholder="輸入標籤後按 Enter"
                className="w-full p-2 border rounded"
                onKeyDown={(e) => handleTagInput(e, marker, setMarker)}
            />
        </div>
    );

    return (
        <div className="h-screen flex flex-col">
            <nav className="bg-indigo-600 p-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-white text-xl font-bold">徒步旅行地圖</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-white">{user?.email}</span>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                        >
                            登出
                        </button>
                    </div>
                </div>
            </nav>
            
            <div className="flex-1 flex">
                {/* 側邊欄 */}
                {showSidebar && (
                    <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
                        <div className="p-4">
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <input
                                        type="text"
                                        placeholder="搜索標記點..."
                                        className="flex-1 p-2 border rounded mr-2"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <button
                                        onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
                                        className="p-2 text-gray-600 hover:text-gray-800"
                                        title={sortDirection === 'desc' ? '當前：由近到遠' : '當前：由遠到近'}
                                    >
                                        {sortDirection === 'desc' ? '↓' : '↑'}
                                    </button>
                                </div>
                            </div>
                            <DateFilter
                                onDateChange={(start, end) => {
                                    setStartDate(start);
                                    setEndDate(end);
                                }}
                            />
                            {/* 標籤列表 */}
                            {allTags.size > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">標籤</h3>
                                    <div className="flex flex-wrap gap-1">
                                        {Array.from(allTags).map(tag => (
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
                            <div className="space-y-2">
                                {filteredMarkers.map(marker => (
                                    <div
                                        key={marker.id}
                                        className="p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleSidebarMarkerClick(marker)}
                                    >
                                        <h3 className="font-bold">{marker.title}</h3>
                                        <p className="text-sm text-gray-600">
                                            {new Date(marker.date).toLocaleDateString('zh-TW', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                weekday: 'short'
                                            })}
                                        </p>
                                        {marker.description && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {marker.description.length > 50 
                                                    ? `${marker.description.substring(0, 50)}...` 
                                                    : marker.description}
                                            </p>
                                        )}
                                        {marker.tags && marker.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {marker.tags.map(tag => (
                                                    <span
                                                        key={tag}
                                                        className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-500 mt-1">{marker.weather}</p>
                                        <div className="mt-2 flex justify-end space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditClick(marker);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm"
                                            >
                                                編輯
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteMarker(marker.id);
                                                }}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                刪除
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 地圖容器 */}
                <div className="flex-1 relative">
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded-full shadow-lg"
                    >
                        {showSidebar ? '←' : '→'}
                    </button>
                    <MapContainer
                        center={[25.0330, 121.5654]}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        ref={mapRef}
                    >
                        <MapEvents onMapClick={handleMapClick} />
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        
                        {filteredMarkers.map(marker => (
                            <Marker
                                key={marker.id}
                                position={[marker.latitude, marker.longitude]}
                                ref={(ref) => {
                                    if (ref) {
                                        markerRefs.current[marker.id] = ref;
                                    }
                                }}
                                eventHandlers={{
                                    click: () => {
                                        setEditingMarker(null); // 重置編輯狀態
                                        setSelectedMarker(marker);
                                    }
                                }}
                            >
                                <Popup
                                    onClose={() => {
                                        setEditingMarker(null); // 關閉彈出窗口時重置編輯狀態
                                    }}
                                >
                                    {editingMarker?.id === marker.id ? (
                                        <div className="p-4">
                                            <input
                                                type="text"
                                                placeholder="標題"
                                                className="w-full mb-2 p-2 border rounded"
                                                value={editingMarker.title}
                                                onChange={(e) => setEditingMarker({
                                                    ...editingMarker,
                                                    title: e.target.value
                                                })}
                                            />
                                            <textarea
                                                placeholder="描述"
                                                className="w-full mb-2 p-2 border rounded"
                                                value={editingMarker.description}
                                                onChange={(e) => setEditingMarker({
                                                    ...editingMarker,
                                                    description: e.target.value
                                                })}
                                            />
                                            <input
                                                type="text"
                                                placeholder="天氣"
                                                className="w-full mb-2 p-2 border rounded"
                                                value={editingMarker.weather}
                                                onChange={(e) => setEditingMarker({
                                                    ...editingMarker,
                                                    weather: e.target.value
                                                })}
                                            />
                                            <input
                                                type="date"
                                                className="w-full mb-2 p-2 border rounded"
                                                value={editingMarker.date}
                                                onChange={(e) => setEditingMarker({
                                                    ...editingMarker,
                                                    date: e.target.value
                                                })}
                                            />
                                            <TagsInput marker={editingMarker} setMarker={setEditingMarker} />
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingMarker(null);
                                                        const markerRef = markerRefs.current[marker.id];
                                                        if (markerRef) {
                                                            markerRef.closePopup();
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                >
                                                    取消
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleEditMarker(marker.id, editingMarker);
                                                        const markerRef = markerRefs.current[marker.id];
                                                        if (markerRef) {
                                                            markerRef.closePopup();
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                                >
                                                    保存
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <MarkerPopup
                                            marker={marker}
                                            onDelete={handleDeleteMarker}
                                            onEdit={() => handleEditClick(marker)}
                                        />
                                    )}
                                </Popup>
                            </Marker>
                        ))}
                        
                        {newMarker && (
                            <Marker position={[newMarker.latitude, newMarker.longitude]}>
                                <Popup>
                                    <div className="p-4">
                                        <input
                                            type="text"
                                            placeholder="標題"
                                            className="w-full mb-2 p-2 border rounded"
                                            value={newMarker.title}
                                            onChange={(e) => setNewMarker({ ...newMarker, title: e.target.value })}
                                        />
                                        <textarea
                                            placeholder="描述"
                                            className="w-full mb-2 p-2 border rounded"
                                            value={newMarker.description}
                                            onChange={(e) => setNewMarker({ ...newMarker, description: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="天氣"
                                            className="w-full mb-2 p-2 border rounded"
                                            value={newMarker.weather}
                                            onChange={(e) => setNewMarker({ ...newMarker, weather: e.target.value })}
                                        />
                                        <input
                                            type="date"
                                            className="w-full mb-2 p-2 border rounded"
                                            value={newMarker.date}
                                            onChange={(e) => setNewMarker({ ...newMarker, date: e.target.value })}
                                        />
                                        <TagsInput marker={newMarker} setMarker={setNewMarker} />
                                        <button
                                            onClick={handleSaveMarker}
                                            className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"
                                        >
                                            保存
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        )}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default Map; 