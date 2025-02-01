import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import MarkerPopup from './MarkerPopup';
import DateFilter from './DateFilter';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { getAllMarkers } from '../services/markers';
import { getAllSerials } from '../services/serial';
import MarkerForm from './MarkerForm';
import SerialManager from './SerialManager';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// 修改標記圖標的部分
const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const defaultIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// 修改地圖點擊事件處理組件
const MapEvents = ({ onMapClick }) => {
    const map = useMap();
    useEffect(() => {
        const handleClick = (e) => {
            onMapClick(e.latlng);
        };
        map.on('click', handleClick);
        return () => {
            map.off('click', handleClick);
        };
    }, [map, onMapClick]);
    return null;
};

const Map = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const [markers, setMarkers] = useState([]);
    const [serials, setSerials] = useState([]);
    const [filteredMarkers, setFilteredMarkers] = useState([]);
    const [newMarker, setNewMarker] = useState(null);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);
    const navigate = useNavigate();
    const [editingMarker, setEditingMarker] = useState(null);
    const mapRef = useRef(null);
    const markerRefs = useRef({});  // 新增：用於存儲標記點的引用
    const [sortDirection, setSortDirection] = useState('desc'); // 'desc' 為由近到遠，'asc' 為由遠到近
    const [allTags, setAllTags] = useState(new Set()); // 存儲所有使用過的標籤
    const [showMarkerForm, setShowMarkerForm] = useState(false);
    const [showSerialManager, setShowSerialManager] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMarkers, setSelectedMarkers] = useState([]);
    const [editingSerial, setEditingSerial] = useState(null);
    const [activeSerials, setActiveSerials] = useState(new Set());
    const [isSerialMode, setIsSerialMode] = useState(false);
    const [currentSerial, setCurrentSerial] = useState([]);
    
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

    // 修改 fetchMarkers 函數
    const fetchMarkers = useCallback(async () => {
        try {
            const data = await getAllMarkers();
            setMarkers(data);
            setFilteredMarkers(data);
            setError(null);
            updateAllTags(data);
        } catch (err) {
            setError('獲取標記點失敗');
            console.error('Error fetching markers:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // 修改 fetchSerials 函數
    const fetchSerials = useCallback(async () => {
        try {
            // 獲取序列列表
            const response = await fetch(`${API_URL}/api/serials`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) {
                throw new Error('獲取序列失敗');
            }
            const serialsList = await response.json();
            
            // 為每個序列獲取其標記點
            const serialsWithMarkers = await Promise.all(serialsList.map(async (serial) => {
                try {
                    // 使用正確的 API 路徑
                    const detailResponse = await fetch(`${API_URL}/api/serials/${serial.id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    if (!detailResponse.ok) {
                        console.error(`獲取序列 ${serial.id} 的詳細信息失敗`);
                        return serial;
                    }
                    const detailData = await detailResponse.json();
                    console.log(`Serial ${serial.id} detail:`, detailData);
                    
                    // 從詳細信息中提取標記點 ID
                    const markerIds = detailData.markers
                        ? detailData.markers.map(m => m.marker_id)
                        : [];
                    
                    return {
                        ...detailData,
                        marker_ids: markerIds
                    };
                } catch (error) {
                    console.error(`獲取序列 ${serial.id} 的詳細信息時發生錯誤:`, error);
                    return serial;
                }
            }));

            console.log('Fetched serials with markers:', serialsWithMarkers);
            setSerials(serialsWithMarkers);
            // 默認顯示所有序列
            setActiveSerials(new Set(serialsWithMarkers.map(serial => serial.id)));
        } catch (err) {
            console.error('Error fetching serials:', err);
        }
    }, []);

    // 修改 useEffect
    useEffect(() => {
        const initializeData = async () => {
            try {
                if (isAuthenticated) {
                    await Promise.all([fetchMarkers(), fetchSerials()]);
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error initializing data:', error);
                setLoading(false);
            }
        };

        initializeData();
    }, [isAuthenticated, fetchMarkers, fetchSerials]);

    // 修改搜索和篩選的 useEffect
    useEffect(() => {
        let filtered = markers;
        
        // 搜索詞篩選
        if (searchTerm) {
            filtered = filtered.filter(marker => 
                marker.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                marker.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    
    // 修改地圖點擊處理函數
    const handleMapClick = (latlng) => {
        if (!isSerialMode) {
            // 關閉任何打開的表單
            setShowMarkerForm(false);
            setSelectedMarker(null);
            setEditingMarker(null);
            // 設置新標記點
            setNewMarker({
                latitude: latlng.lat,
                longitude: latlng.lng,
                date: new Date().toISOString().split('T')[0]
            });
            setShowMarkerForm(true);
        }
    };

    // 修改標記點點擊處理函數
    const handleMarkerClick = (marker) => {
        if (isSerialMode) {
            // 檢查是否與最後一個標記點相同
            const lastMarker = currentSerial[currentSerial.length - 1];
            if (lastMarker && lastMarker.id === marker.id) {
                alert('不能連續添加相同的標記點');
                return;
            }
            setCurrentSerial([...currentSerial, marker]);
        } else {
            // 正常模式下的標記點擊行為
            setSelectedMarker(marker);
            setShowMarkerForm(false);
            setEditingMarker(null);
            const markerRef = markerRefs.current[marker.id];
            if (markerRef) {
                markerRef.openPopup();
            }
        }
    };

    // 修改標記表單關閉處理函數
    const handleMarkerFormClose = () => {
        setSelectedMarker(null);
        setNewMarker(null);
        setShowMarkerForm(false);
        setEditingMarker(null);
        // 重新加載標記點
        fetchMarkers();
    };

    // 處理序列管理器關閉
    const handleSerialManagerClose = () => {
        setShowSerialManager(false);
        setEditingSerial(null);
        setSelectedMarkers([]);
        fetchSerials(); // 重新加載序列
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

    const handleMarkerSelect = (marker) => {
        setSelectedMarkers(prev => {
            const isSelected = prev.some(m => m.id === marker.id);
            if (isSelected) {
                return prev.filter(m => m.id !== marker.id);
            } else {
                return [...prev, marker];
            }
        });
    };

    // 處理序列創建完成
    const handleSerialCreated = () => {
        fetchSerials();
        setSelectedMarkers([]);
    };

    // 切換序列顯示狀態
    const toggleSerial = (serialId) => {
        setActiveSerials(prev => {
            const newSet = new Set(prev);
            if (newSet.has(serialId)) {
                newSet.delete(serialId);
            } else {
                newSet.add(serialId);
            }
            return newSet;
        });
    };

    // 修改 handleEditSerialClick 函數
    const handleEditSerialClick = (serial) => {
        if (!serial) {
            console.error('Invalid serial data');
            return;
        }
        
        console.log('Editing serial:', serial);
        
        // 從 markers 數組中找到對應的標記點
        const serialMarkers = serial.markers
            .map(markerData => {
                const marker = markers.find(m => m.id === markerData.marker_id);
                if (!marker) {
                    console.log('Marker not found:', markerData.marker_id);
                }
                return marker;
            })
            .filter(Boolean);
        
        console.log('Found markers for serial:', serialMarkers);
        
        if (serialMarkers.length === 0) {
            alert('此序列沒有有效的標記點');
            return;
        }
        
        setIsSerialMode(true);
        setCurrentSerial(serialMarkers);
        setEditingSerial(serial);
    };

    // 修改 saveSerial 函數
    const saveSerial = async () => {
        if (!currentSerial || currentSerial.length < 2) {
            alert('序列至少需要包含兩個標記點');
            return;
        }

        // 檢查是否有連續重複的標記點
        for (let i = 1; i < currentSerial.length; i++) {
            if (currentSerial[i].id === currentSerial[i - 1].id) {
                alert('序列中不能包含連續重複的標記點');
                return;
            }
        }

        try {
            const serialData = {
                markers: currentSerial.map(marker => marker.id),
                name: editingSerial ? editingSerial.name : `序列 ${serials.length + 1}`,
                color: editingSerial ? editingSerial.color : `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
                description: editingSerial?.description || null
            };

            console.log('Saving serial with data:', serialData);

            const url = editingSerial 
                ? `${API_URL}/api/serials/${editingSerial.id}`
                : `${API_URL}/api/serials`;

            const method = editingSerial ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(serialData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '保存序列失敗');
            }

            // 重新加載序列數據
            await fetchSerials();
            
            // 清除序列模式
            setIsSerialMode(false);
            setCurrentSerial([]);
            setEditingSerial(null);
            
            alert('序列保存成功！');
        } catch (error) {
            console.error('Error saving serial:', error);
            alert('保存序列失敗：' + error.message);
        }
    };

    // 添加刪除序列功能
    const handleDeleteSerial = async (serialId) => {
        if (!window.confirm('確定要刪除此序列嗎？')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/serials/${serialId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('刪除序列失敗');
            }

            // 重新加載序列數據
            await fetchSerials();
            alert('序列已刪除');
        } catch (error) {
            console.error('Error deleting serial:', error);
            alert('刪除序列失敗：' + error.message);
        }
    };

    // 修改序列控制面板的渲染
    const SerialControls = () => (
        <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-lg">
            <div className="mb-4">
                {!isSerialMode ? (
                    <button
                        onClick={startNewSerial}
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        創建新序列
                    </button>
                ) : (
                    <div className="space-y-2">
                        <div className="bg-yellow-100 p-2 rounded text-sm">
                            序列模式：已選擇 {currentSerial.length} 個標記點
                        </div>
                        <button
                            onClick={saveSerial}
                            className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            保存序列
                        </button>
                        <button
                            onClick={cancelSerial}
                            className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                            取消
                        </button>
                    </div>
                )}
            </div>
            <div className="space-y-2">
                {serials.map(serial => (
                    <div
                        key={serial.id}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={activeSerials.has(serial.id)}
                                onChange={() => toggleSerial(serial.id)}
                                className="mr-2"
                            />
                            <span
                                className="w-4 h-4 rounded-full mr-2"
                                style={{ backgroundColor: serial.color }}
                            />
                            <span>{serial.name}</span>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handleEditSerialClick(serial)}
                                className="text-indigo-600 hover:text-indigo-800"
                            >
                                編輯
                            </button>
                            <button
                                onClick={() => handleDeleteSerial(serial.id)}
                                className="text-red-600 hover:text-red-800"
                            >
                                刪除
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const startNewSerial = () => {
        setIsSerialMode(true);
        setCurrentSerial([]);
    };

    // 修改序列線條渲染部分
    const renderSerialLines = () => {
        if (!serials || !markers) {
            console.log('No serials or markers data');
            return null;
        }
        
        return serials.map(serial => {
            if (!serial || !activeSerials.has(serial.id)) {
                return null;
            }
            
            console.log('Processing serial for rendering:', serial);
            
            // 確保 serial.markers 存在且是數組，並且過濾掉無效的標記點
            if (!Array.isArray(serial.markers)) {
                console.log('Invalid markers array for serial:', serial.id);
                return null;
            }
            
            // 根據 sequence_number 排序並獲取有效的標記點位置
            const positions = serial.markers
                .filter(markerData => markerData && markerData.marker_id && markerData.latitude && markerData.longitude)
                .sort((a, b) => a.sequence_number - b.sequence_number)
                .map(markerData => [markerData.latitude, markerData.longitude]);

            console.log('Valid positions for serial line:', positions);

            if (positions.length < 2) {
                console.log('Not enough valid positions for serial:', serial.id);
                return null;
            }

            return (
                <Polyline
                    key={serial.id}
                    positions={positions}
                    pathOptions={{
                        color: serial.color || '#3388ff',
                        weight: 3,
                        opacity: 0.7
                    }}
                />
            );
        }).filter(Boolean);
    };

    const cancelSerial = () => {
        setIsSerialMode(false);
        setCurrentSerial([]);
    };

    // 如果未認證，顯示登入提示
    if (!isAuthenticated) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600 mb-4">請先登入以使用地圖功能</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        前往登入
                    </button>
                </div>
            </div>
        );
    }

    if (loading) return <div className="h-screen flex items-center justify-center">載入中...</div>;
    if (error) return <div className="h-screen flex items-center justify-center text-red-600">{error}</div>;

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
                        
                        <MarkerClusterGroup>
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
                                        click: () => handleMarkerClick(marker)
                                    }}
                                    icon={currentSerial.find(m => m.id === marker.id) ? redIcon : defaultIcon}
                                >
                                    <Popup
                                        onClose={() => {
                                            setEditingMarker(null); // 關閉彈出窗口時重置編輯狀態
                                            setShowMarkerForm(false); // 確保表單被關閉
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
                        </MarkerClusterGroup>
                        
                        {/* 渲染已保存的序列線條 */}
                        {renderSerialLines()}

                        {/* 顯示當前正在創建/編輯的序列線條 */}
                        {isSerialMode && currentSerial && currentSerial.length >= 2 && (
                            <Polyline
                                positions={currentSerial.map(marker => [marker.latitude, marker.longitude])}
                                color="red"
                                weight={3}
                                opacity={0.7}
                            />
                        )}
                    </MapContainer>

                    {/* 序列控制面板 */}
                    <SerialControls />

                    {/* 序列管理器 */}
                    <SerialManager
                        isOpen={showSerialManager}
                        onClose={handleSerialManagerClose}
                        selectedMarkers={selectedMarkers}
                        onSerialCreated={handleSerialCreated}
                        editingSerial={editingSerial}
                    />
                </div>
            </div>

            {/* 將 MarkerForm 移到最上層 */}
            {showMarkerForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
                    <MarkerForm
                        marker={selectedMarker || newMarker}
                        onClose={handleMarkerFormClose}
                        onSave={() => {
                            handleMarkerFormClose();
                            fetchMarkers();
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default Map; 