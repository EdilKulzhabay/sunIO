import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const DateRangePicker = ({ label, value, onChange, placeholder }: DateRangePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleOpen = () => {
        if (value) {
            const [start, end] = value.split(' - ');
            setStartDate(start || '');
            setEndDate(end || start || '');
        }
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleApply = () => {
        if (startDate) {
            // Если конечная дата не выбрана или равна начальной, используем только начальную дату
            const result = endDate && endDate !== startDate ? `${startDate} - ${endDate}` : `${startDate} - ${startDate}`;
            onChange(result);
        }
        setIsOpen(false);
    };

    const handleClear = () => {
        setStartDate('');
        setEndDate('');
        onChange('');
        setIsOpen(false);
    };


    return (
        <div className="relative">
            <label className="block text-sm font-medium mb-2">{label}</label>
            <button
                type="button"
                onClick={handleOpen}
                className="w-full p-2 border border-gray-300 rounded-md text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
                <span className={value ? 'text-gray-900' : 'text-gray-500'}>
                    {value ? (() => {
                        const [start, end] = value.split(' - ');
                        return start === end ? start : value;
                    })() : placeholder || 'Выберите даты'}
                </span>
                <Calendar size={16} className="text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Начальная дата</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Конечная дата</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                min={startDate || undefined}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        
                        <div className="mt-4 flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                                Очистить
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                onClick={handleApply}
                                disabled={!startDate}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Применить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay to close when clicking outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={handleClose}
                />
            )}
        </div>
    );
};
