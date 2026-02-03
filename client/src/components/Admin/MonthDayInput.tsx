import { useState, useEffect } from 'react';

interface MonthDayInputProps {
    label: string;
    value: string; // Формат: "MM-DD" или пустая строка
    onChange: (value: string) => void;
    placeholder?: string;
    min?: string; // Минимальная дата в формате "MM-DD"
}

const MONTHS = [
    { value: '01', label: 'Январь' },
    { value: '02', label: 'Февраль' },
    { value: '03', label: 'Март' },
    { value: '04', label: 'Апрель' },
    { value: '05', label: 'Май' },
    { value: '06', label: 'Июнь' },
    { value: '07', label: 'Июль' },
    { value: '08', label: 'Август' },
    { value: '09', label: 'Сентябрь' },
    { value: '10', label: 'Октябрь' },
    { value: '11', label: 'Ноябрь' },
    { value: '12', label: 'Декабрь' },
];

const getDaysInMonth = (month: number): number => {
    // Используем текущий год для определения количества дней
    const year = new Date().getFullYear();
    return new Date(year, month, 0).getDate();
};

export const MonthDayInput = ({ label, value, onChange, min }: MonthDayInputProps) => {
    const [month, setMonth] = useState<string>('');
    const [day, setDay] = useState<string>('');

    // Парсинг значения при инициализации
    useEffect(() => {
        if (value && value.includes('-')) {
            const [m, d] = value.split('-');
            setMonth(m || '');
            setDay(d || '');
        } else {
            setMonth('');
            setDay('');
        }
    }, [value]);

    // Обновление значения при изменении месяца или дня
    const handleMonthChange = (newMonth: string) => {
        setMonth(newMonth);
        if (newMonth && day) {
            const maxDay = getDaysInMonth(parseInt(newMonth));
            const validDay = parseInt(day) > maxDay ? maxDay.toString().padStart(2, '0') : day;
            onChange(`${newMonth}-${validDay}`);
            setDay(validDay);
        } else if (newMonth) {
            onChange(`${newMonth}-${day || '01'}`);
        } else {
            onChange('');
        }
    };

    const handleDayChange = (newDay: string) => {
        setDay(newDay);
        if (month && newDay) {
            onChange(`${month}-${newDay}`);
        } else if (month) {
            onChange(`${month}-${newDay || '01'}`);
        } else {
            onChange('');
        }
    };

    // Получение доступных дней для выбранного месяца
    const getAvailableDays = (): number[] => {
        if (!month) return [];
        const daysCount = getDaysInMonth(parseInt(month));
        return Array.from({ length: daysCount }, (_, i) => i + 1);
    };

    // Проверка минимальной даты для месяца
    const isMonthDisabled = (monthValue: string): boolean => {
        if (!min) return false;
        const [minMonth] = min.split('-');
        return parseInt(monthValue) < parseInt(minMonth);
    };

    // Проверка минимальной даты для дня
    const isDayDisabled = (dayValue: number): boolean => {
        if (!min || !month) return false;
        const [minMonth, minDay] = min.split('-');
        const monthNum = parseInt(month);
        const minMonthNum = parseInt(minMonth);
        
        if (monthNum < minMonthNum) return true;
        if (monthNum === minMonthNum && dayValue < parseInt(minDay)) return true;
        return false;
    };

    const availableDays = getAvailableDays();

    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="text-sm font-medium">{label}</label>
            <div className="flex gap-2">
                <select
                    value={month}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className="flex-1 p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Месяц</option>
                    {MONTHS.map((m) => {
                        const disabled = isMonthDisabled(m.value);
                        return (
                            <option key={m.value} value={m.value} disabled={disabled}>
                                {m.label}
                            </option>
                        );
                    })}
                </select>
                <select
                    value={day}
                    onChange={(e) => handleDayChange(e.target.value)}
                    disabled={!month}
                    className="flex-1 p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                    <option value="">День</option>
                    {availableDays.map((d) => {
                        const dayStr = d.toString().padStart(2, '0');
                        const disabled = isDayDisabled(d);
                        return (
                            <option key={d} value={dayStr} disabled={disabled}>
                                {d}
                            </option>
                        );
                    })}
                </select>
            </div>
        </div>
    );
};

