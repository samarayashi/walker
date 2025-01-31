import React, { useState } from 'react';

const DateFilter = ({ onDateChange }) => {
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showRangePicker, setShowRangePicker] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // 生成年份列表（前後10年）
    const years = Array.from({ length: 21 }, (_, i) => selectedYear - 10 + i);
    
    // 生成月份列表
    const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(2000, i, 1);
        return {
            value: i,
            label: date.toLocaleString('zh-TW', { month: 'long' })
        };
    });

    const handleYearClick = (year) => {
        const start = `${year}-01-01`;
        const end = `${year}-12-31`;
        setStartDate(start);
        setEndDate(end);
        onDateChange(start, end);
        setShowYearPicker(false);
    };

    const handleMonthClick = (month) => {
        const year = selectedYear;
        const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
        setStartDate(start);
        setEndDate(end);
        onDateChange(start, end);
        setShowMonthPicker(false);
    };

    const handleCustomDateChange = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        onDateChange(start, end);
        
        // 如果開始日期和結束日期都已選擇，則關閉選擇器
        if (start && end) {
            setShowRangePicker(false);
        }
    };

    const clearDates = () => {
        setStartDate('');
        setEndDate('');
        onDateChange('', '');
        setShowRangePicker(false);
    };

    // 切換選擇器的顯示狀態
    const togglePicker = (pickerName) => {
        setShowYearPicker(pickerName === 'year' ? !showYearPicker : false);
        setShowMonthPicker(pickerName === 'month' ? !showMonthPicker : false);
        setShowRangePicker(pickerName === 'range' ? !showRangePicker : false);
    };

    return (
        <div className="mb-4 space-y-2">
            <div className="flex space-x-2 mb-2">
                <button
                    onClick={() => togglePicker('year')}
                    className={`px-3 py-1 rounded ${
                        showYearPicker 
                            ? 'bg-indigo-500 text-white' 
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                >
                    選擇年份
                </button>
                <button
                    onClick={() => togglePicker('month')}
                    className={`px-3 py-1 rounded ${
                        showMonthPicker 
                            ? 'bg-indigo-500 text-white' 
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                >
                    選擇月份
                </button>
                <button
                    onClick={() => togglePicker('range')}
                    className={`px-3 py-1 rounded ${
                        showRangePicker 
                            ? 'bg-indigo-500 text-white' 
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                >
                    選擇區間
                </button>
                {(startDate || endDate) && (
                    <button
                        onClick={clearDates}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                        清除
                    </button>
                )}
            </div>

            {showYearPicker && (
                <div className="absolute bg-white border rounded-lg shadow-lg p-2 z-10">
                    <div className="grid grid-cols-3 gap-2">
                        {years.map(year => (
                            <button
                                key={year}
                                onClick={() => handleYearClick(year)}
                                className={`px-3 py-1 rounded ${
                                    year === selectedYear
                                        ? 'bg-indigo-500 text-white'
                                        : 'hover:bg-indigo-100'
                                }`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {showMonthPicker && (
                <div className="absolute bg-white border rounded-lg shadow-lg p-2 z-10">
                    <div className="grid grid-cols-3 gap-2">
                        {months.map(month => (
                            <button
                                key={month.value}
                                onClick={() => handleMonthClick(month.value)}
                                className="px-3 py-1 rounded hover:bg-indigo-100"
                            >
                                {month.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {showRangePicker && (
                <div className="absolute bg-white border rounded-lg shadow-lg p-4 z-10">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">開始日期</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded"
                                value={startDate}
                                max={endDate || undefined}
                                onChange={(e) => handleCustomDateChange(e.target.value, endDate)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">結束日期</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded"
                                value={endDate}
                                min={startDate || undefined}
                                onChange={(e) => handleCustomDateChange(startDate, e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowRangePicker(false)}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                                關閉
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {(startDate || endDate) && (
                <div className="text-sm text-gray-600">
                    篩選期間：
                    <span className="font-medium">
                        {startDate && new Date(startDate).toLocaleDateString('zh-TW')}
                        {startDate && endDate && ' 至 '}
                        {endDate && new Date(endDate).toLocaleDateString('zh-TW')}
                    </span>
                </div>
            )}
        </div>
    );
};

export default DateFilter; 