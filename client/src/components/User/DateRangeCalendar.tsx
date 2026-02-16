import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangeCalendarProps {
    onDateClick?: (date: Date) => void;
    eventDateBorders?: Record<string, string>; // Цвет обводки по датам (YYYY-MM-DD)
    eventDateDots?: Record<string, string>; // Цвет точки по датам (YYYY-MM-DD)
    selectedDate?: Date | null; // Выбранная дата для подсветки
}

const MONTHS = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const DAYS_OF_WEEK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

export const DateRangeCalendar = ({ 
    onDateClick,
    eventDateBorders = {},
    eventDateDots = {},
    selectedDate = null
}: DateRangeCalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays: number[] = [];
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        prevMonthDays.push(prevMonthLastDay - i);
    }

    const handleDateClick = (day: number, isPrevMonth: boolean = false, isNextMonth: boolean = false) => {
        let clickedDate: Date;
        if (isPrevMonth) {
            clickedDate = new Date(year, month - 1, day);
        } else if (isNextMonth) {
            clickedDate = new Date(year, month + 1, day);
        } else {
            clickedDate = new Date(year, month, day);
        }
        clickedDate.setHours(0, 0, 0, 0);
        onDateClick?.(clickedDate);
    };

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const isToday = (day: number, isPrevMonth: boolean = false, isNextMonth: boolean = false): boolean => {
        if (isPrevMonth || isNextMonth) return false;
        const today = new Date();
        return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    };

    const getDateKey = (day: number, isPrevMonth: boolean = false, isNextMonth: boolean = false) => {
        let checkDate: Date;
        if (isPrevMonth) checkDate = new Date(year, month - 1, day);
        else if (isNextMonth) checkDate = new Date(year, month + 1, day);
        else checkDate = new Date(year, month, day);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate.toISOString().split('T')[0];
    };

    const getEventBorderColor = (day: number, isPrevMonth: boolean = false, isNextMonth: boolean = false): string | null => {
        const key = getDateKey(day, isPrevMonth, isNextMonth);
        return eventDateBorders[key] || null;
    };

    const getEventDotColor = (day: number, isPrevMonth: boolean = false, isNextMonth: boolean = false): string | null => {
        const key = getDateKey(day, isPrevMonth, isNextMonth);
        return eventDateDots[key] || null;
    };

    const isSelected = (day: number, isPrevMonth: boolean = false, isNextMonth: boolean = false): boolean => {
        if (!selectedDate) return false;
        const key = getDateKey(day, isPrevMonth, isNextMonth);
        const selectedKey = selectedDate.toISOString().split('T')[0];
        return key === selectedKey;
    };

    const daysToShow = 42;
    const totalDaysShown = prevMonthDays.length + daysInMonth;
    const nextMonthDays: number[] = [];
    if (totalDaysShown < daysToShow) {
        for (let i = 1; i <= daysToShow - totalDaysShown; i++) {
            nextMonthDays.push(i);
        }
    }

    const dayButtonClass = (hasDot: boolean, isToday: boolean, isOtherMonth: boolean, isSelectedDate: boolean) => `
        aspect-square p-2 rounded-full text-sm transition-colors relative flex flex-col items-center justify-center
        ${(isToday && !hasDot) || isSelectedDate ? 'bg-white/40' : ''}
        ${isOtherMonth ? 'text-white/40' : ''}
        hover:bg-white/10
    `;

    return (
        <div className="bg-[#114E50] rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <h2 className="text-lg font-medium">{MONTHS[month]} {year}</h2>
                <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded transition-colors">
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="text-center text-sm text-white/60 py-2">{day}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {prevMonthDays.map((day) => {
                    const borderColor = getEventBorderColor(day, true);
                    const dotColor = getEventDotColor(day, true);
                    const selected = isSelected(day, true);
                    return (
                        <button
                            key={`prev-${day}`}
                            onClick={() => handleDateClick(day, true)}
                            className={dayButtonClass(!!dotColor, false, true, selected)}
                        >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${borderColor ? 'border' : ''}`} style={borderColor ? { borderColor } : undefined}>
                                <p>{day}</p>
                            </div>
                            {dotColor && <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />}
                        </button>
                    );
                })}

                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const today = isToday(day);
                    const borderColor = getEventBorderColor(day);
                    const dotColor = getEventDotColor(day);
                    const selected = isSelected(day);
                    return (
                        <button
                            key={day}
                            onClick={() => handleDateClick(day)}
                            className={dayButtonClass(!!dotColor, today, false, selected)}
                        >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${borderColor ? 'border' : ''}`} style={borderColor ? { borderColor } : undefined}>
                                <p>{day}</p>
                            </div>
                            {dotColor && <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />}
                        </button>
                    );
                })}

                {nextMonthDays.map((day) => {
                    const borderColor = getEventBorderColor(day, false, true);
                    const dotColor = getEventDotColor(day, false, true);
                    const selected = isSelected(day, false, true);
                    return (
                        <button
                            key={`next-${day}`}
                            onClick={() => handleDateClick(day, false, true)}
                            className={dayButtonClass(!!dotColor, false, true, selected)}
                        >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${borderColor ? 'border' : ''}`} style={borderColor ? { borderColor } : undefined}>
                                <p>{day}</p>
                            </div>
                            {dotColor && <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
