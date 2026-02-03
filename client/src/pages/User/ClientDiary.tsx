import { UserLayout } from "../../components/User/UserLayout"
import { BackNav } from "../../components/User/BackNav"
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import arrowDown from "../../assets/arrowDown.png";
import { Switch } from "../../components/User/Switch.tsx";
import { RedButton } from "../../components/User/RedButton.tsx";
import { toast } from "react-toastify";
import calendarLeft from "../../assets/calendarLeft.png";
import calendarRight from "../../assets/calendarRight.png";
import goldCheck from "../../assets/goldCheck.png";
import redCross from "../../assets/redCross.png";

const daysOfWeek = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const getWeekdayLabel = (date: Date) => daysOfWeek[(date.getDay() + 6) % 7];
const width = window.innerWidth;
const widthPerDay = (width - 60) / 7;

export const ClientDiary = () => {
    const [diary, setDiary] = useState<any>({
        discovery: '',
        achievement: '',
        gratitude: '',
        uselessTask: false,
    });
    const [todayDiaryId, setTodayDiaryId] = useState<string | null>(null);
    const [diaries, setDiaries] = useState<any>([]);
    const [allDiaries, setAllDiaries] = useState<any[]>([]);
    const [isOpenToday, setIsOpenToday] = useState(true);
    const [content, setContent] = useState<any>(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [calendarDates, setCalendarDates] = useState<any[]>([]);
    const [leftVisibleDate, setLeftVisibleDate] = useState<Date | null>(null);
    const calendarContainerRef = useRef<HTMLDivElement | null>(null);

    const toLocalDateKey = (value: Date | string) => {
        const date = typeof value === 'string' ? new Date(value) : value;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const buildDiaryList = (source: any[]) => {
        const todayKey = toLocalDateKey(new Date());
        return source
            .filter((item) => toLocalDateKey(item.createdAt) !== todayKey)
            .map((item) => ({
                ...item,
                isOpen: false,
            }));
    };

    useEffect(() => {
        // Проверка на блокировку пользователя
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.isBlocked && user.role !== 'admin') {
                    navigate('/client/blocked-user');
                    return;
                }
            } catch (e) {
                console.error('Ошибка парсинга user из localStorage:', e);
            }
        }

        const start = new Date(2025, 9, 1); // 01.10.2025
        start.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dates: Date[] = [];
        for (const date = new Date(start); date <= today; date.setDate(date.getDate() + 1)) {
            dates.push(new Date(date));
        }
        setCalendarDates(dates);

        fetchDiaries();
        fetchContent();
    }, [navigate]);

    // Разрешаем копирование и вставку на странице дневника
    useEffect(() => {
        // Функция для проверки, находится ли элемент на странице дневника
        const isDiaryPageElement = (element: HTMLElement | null): boolean => {
            if (!element) return false;
            // Проверяем, находится ли элемент внутри контейнера дневника
            const diaryContainer = element.closest('[data-diary-page]');
            return diaryContainer !== null;
        };

        // Переопределяем выделение текста - разрешаем на странице дневника
        const handleSelectStart = (e: Event) => {
            const target = e.target as HTMLElement;
            if (isDiaryPageElement(target)) {
                // Останавливаем распространение события, чтобы обработчики UserLayout не блокировали его
                e.stopImmediatePropagation();
                // Разрешаем выделение на странице дневника
                return;
            }
        };

        // Переопределяем копирование - разрешаем на странице дневника
        const handleCopy = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            if (isDiaryPageElement(target)) {
                // Останавливаем распространение события, чтобы обработчики UserLayout не блокировали его
                e.stopImmediatePropagation();
                // Разрешаем копирование на странице дневника
                return;
            }
        };

        // Переопределяем вставку - разрешаем на странице дневника
        const handlePaste = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            if (isDiaryPageElement(target)) {
                // Останавливаем распространение события, чтобы обработчики UserLayout не блокировали его
                e.stopImmediatePropagation();
                // Разрешаем вставку на странице дневника
                return;
            }
        };

        // Переопределяем вырезание - разрешаем на странице дневника
        const handleCut = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            if (isDiaryPageElement(target)) {
                // Останавливаем распространение события, чтобы обработчики UserLayout не блокировали его
                e.stopImmediatePropagation();
                // Разрешаем вырезание на странице дневника
                return;
            }
        };

        // Переопределяем горячие клавиши - разрешаем на странице дневника
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (isDiaryPageElement(target)) {
                // Разрешаем Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A на странице дневника
                if (e.ctrlKey || e.metaKey) {
                    const key = e.key.toLowerCase();
                    if (['c', 'v', 'x', 'a'].includes(key)) {
                        // Останавливаем распространение события, чтобы обработчики UserLayout не блокировали его
                        e.stopImmediatePropagation();
                        // Разрешаем операцию
                        return;
                    }
                }
            }
        };

        // Добавляем обработчики с capture фазой для приоритета над UserLayout
        // Используем { capture: true, passive: false } для возможности вызова stopImmediatePropagation
        document.addEventListener('selectstart', handleSelectStart, { capture: true });
        document.addEventListener('copy', handleCopy, { capture: true });
        document.addEventListener('paste', handlePaste, { capture: true });
        document.addEventListener('cut', handleCut, { capture: true });
        document.addEventListener('keydown', handleKeyDown, { capture: true });

        // Очистка обработчиков при размонтировании
        return () => {
            document.removeEventListener('selectstart', handleSelectStart, { capture: true });
            document.removeEventListener('copy', handleCopy, { capture: true });
            document.removeEventListener('paste', handlePaste, { capture: true });
            document.removeEventListener('cut', handleCut, { capture: true });
            document.removeEventListener('keydown', handleKeyDown, { capture: true });
        };
    }, []);

    const fetchDiaries = async () => {
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await api.post('/api/diary/my', {userId: userData._id}, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const todayKey = toLocalDateKey(new Date());
            setAllDiaries(response.data.data || []);
            const todayDiary = response.data.data.find((item: any) => toLocalDateKey(item.createdAt) === todayKey);
            
            // Если есть запись за сегодня, загружаем её данные в форму
            if (todayDiary) {
                setTodayDiaryId(todayDiary._id);
                setDiary({
                    discovery: todayDiary.discovery || '',
                    achievement: todayDiary.achievement || '',
                    gratitude: todayDiary.gratitude || '',
                    uselessTask: todayDiary.uselessTask || false,
                });
            } else {
                setTodayDiaryId(null);
                setDiary({
                    discovery: '',
                    achievement: '',
                    gratitude: '',
                    uselessTask: false,
                });
            }
            
            // Исключаем сегодняшнюю запись из списка старых записей
            setDiaries(buildDiaryList(response.data.data || []));
        } catch (error) {
            console.error('Ошибка загрузки дневника:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (e: any) => {
        setDiary({ ...diary, [e.target.name]: e.target.value });
    }

    const handleSubmit = async () => {
        setLoading(true);
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        try {
            let response;
            if (todayDiaryId) {
                // Обновляем существующую запись за сегодня
                response = await api.put(`/api/diary/${todayDiaryId}`, diary, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            } else {
                // Создаём новую запись
                response = await api.post('/api/diary', {userId: userData._id, ...diary}, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            }
            
            if (response.data.success) {
                toast.success('Дневник успешно сохранен');
                fetchDiaries();
            } else {
                toast.error(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка при сохранении дневника');
        } finally {
            setLoading(false);
        }
    }

    const handleToggleDiaryToday = () => {
        setIsOpenToday(!isOpenToday);
    }

    const fetchContent = async () => {
        const response = await api.get(`/api/dynamic-content/name/dnevnik-desc`);
        setContent(response.data.data);
    };

    const updateLeftVisibleDate = () => {
        const container = calendarContainerRef.current;
        if (!container || calendarDates.length === 0) return;

        const sampleItem = container.querySelector('[data-calendar-item]') as HTMLElement | null;
        const styles = window.getComputedStyle(container);
        const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
        const itemWidth = sampleItem?.offsetWidth || 24;
        const step = itemWidth + gap;
        const index = Math.min(
            calendarDates.length - 1,
            Math.max(0, Math.floor(container.scrollLeft / step))
        );

        setLeftVisibleDate(calendarDates[index]);
    };

    const scrollByDays = (days: number) => {
        const container = calendarContainerRef.current;
        if (!container) return;
        const sampleItem = container.querySelector('[data-calendar-item]') as HTMLElement | null;
        const styles = window.getComputedStyle(container);
        const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
        const itemWidth = sampleItem?.offsetWidth || 24;
        const step = itemWidth + gap;
        container.scrollBy({ left: days * step, behavior: 'smooth' });
    };

    useEffect(() => {
        if (loading) return;
        if (!calendarDates.length) return;
        const container = calendarContainerRef.current;
        if (!container) return;

        const scrollToEnd = () => {
            container.scrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
            updateLeftVisibleDate();
        };

        // Ждем отрисовку элементов и корректной ширины контейнера
        requestAnimationFrame(() => {
            requestAnimationFrame(scrollToEnd);
        });
    }, [calendarDates.length, loading]);

    const checkDiaryForDate = (date: Date) => {
        const selectedKey = toLocalDateKey(date);
        return allDiaries.find((item: any) => toLocalDateKey(item.createdAt) === selectedKey);
    }

    useEffect(() => {
        if (!selectedDate) {
            setDiaries(buildDiaryList(allDiaries));
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate <= today && checkDiaryForDate(selectedDate)) {
            const selectedKey = toLocalDateKey(selectedDate);
            const filtered = allDiaries.filter((item: any) => toLocalDateKey(item.createdAt) === selectedKey);
            setDiaries(buildDiaryList(filtered));
        } else {
            setDiaries(buildDiaryList(allDiaries));
        }
    }, [selectedDate, allDiaries]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#161616]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div>
            <UserLayout>
                <BackNav title="Дневник" />
                <div 
                    className="px-4 mt-2 pb-10 bg-[#161616]" 
                    data-diary-page
                    style={{
                        userSelect: 'text',
                        WebkitUserSelect: 'text',
                        MozUserSelect: 'text',
                        msUserSelect: 'text',
                        WebkitTouchCallout: 'default'
                    }}
                >
                    <p className="mt-4" dangerouslySetInnerHTML={{ __html: content?.content }}>
                    </p>

                    <div className="mt-4 bg-[#333333] p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium">
                                {(() => {
                                    const baseDate = leftVisibleDate || calendarDates[0];
                                    if (!baseDate) return '';
                                    const formatted = baseDate.toLocaleDateString('ru-RU', {
                                        month: 'long',
                                        year: 'numeric',
                                    });
                                    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
                                })()}
                            </h2>
                            <div className="flex items-center gap-x-4">
                                <button
                                    onClick={() => {
                                        scrollByDays(-7);
                                    }}
                                    className="w-6 h-6"
                                >
                                    <img 
                                        src={calendarLeft}
                                        alt="arrow-left"
                                        className="w-6 h-6"
                                    />
                                </button>
                                <button
                                    onClick={() => {
                                        scrollByDays(7);
                                    }}
                                    className="w-6 h-6"
                                >
                                    <img 
                                        src={calendarRight}
                                        alt="arrow-right"
                                        className="w-6 h-6"
                                    />
                                </button>
                            </div>
                        </div>
                        <div
                            ref={calendarContainerRef}
                            onScroll={updateLeftVisibleDate}
                            className="mt-4 overflow-x-scroll scrollbar-hide flex items-start gap-2.5 pr-1"
                        >
                            {calendarDates.map((date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return (
                                    <button
                                        data-calendar-item
                                        className="shrink-0 cursor-pointer flex flex-col items-center justify-center"
                                        style={{ width: `${widthPerDay}px`, minWidth: `${widthPerDay}px` }}
                                        onClick={() => {
                                            if (selectedDate?.toISOString().split('T')[0] === date.toISOString().split('T')[0]) {
                                                setSelectedDate(null);
                                            } else {
                                                setSelectedDate(date);
                                            }
                                        }}
                                        key={date.toISOString().split('T')[0]}
                                    >
                                        <p className="text-sm">{getWeekdayLabel(date)}</p>
                                        <div className={`mt-2 text-sm w-6 h-6 flex items-center justify-center ${today.toISOString().split('T')[0] === date.toISOString().split('T')[0] ? 'border-1 border-[#FFC293] rounded-full' : ''} ${selectedDate?.toISOString().split('T')[0] === date.toISOString().split('T')[0] ? 'bg-white/20 rounded-full' : ''}`}>
                                            <p>{date.getDate()}</p>
                                        </div>
                                        {checkDiaryForDate(date) && (
                                            <div className="mt-1 flex items-center justify-center">
                                                <img src={goldCheck} alt="gold-check" className="w-3 h-3" />
                                            </div>
                                        )}
                                        {!checkDiaryForDate(date) && date < today && (
                                            <div className="mt-1 flex items-center justify-center">
                                                <img src={redCross} alt="red-cross" className="w-3 h-3" />
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                            {/* <div className="flex items-center justify-between pr-1">
                                {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map((day) => {
                                    return (
                                        <div key={day} className="flex flex-col items-center justify-center w-6">
                                            <p className="text-sm">{day}</p>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="mt-4 flex items-start justify-between pr-1">
                                {Array.from({ length: 7 }).map((_, index) => {
                                    if (!weekStart) return null;
                                    const today = new Date();
                                    const date = new Date(weekStart);
                                    date.setDate(weekStart.getDate() + index);
                                    return (
                                        <button onClick={() => {
                                            if (selectedDate?.toISOString().split('T')[0] === date.toISOString().split('T')[0]) {
                                                setSelectedDate(null);
                                            } else {
                                                setSelectedDate(date);
                                            }
                                        }} key={index} className="w-6 cursor-pointer">
                                            {weekStart && (
                                                <div className={`text-sm text-center w-6 h-6 flex items-center justify-center ${selectedDate?.toISOString().split('T')[0] === date.toISOString().split('T')[0] ? 'bg-white/20 rounded-full' : ''} ${today.toISOString().split('T')[0] === date.toISOString().split('T')[0] ? 'border-1 border-[#FFC293] rounded-full' : ''}`}>
                                                    <p>{date.getDate()}</p>
                                                </div>
                                            )}
                                            {checkDiaryForDate(date) && (
                                                <div className="mt-1 flex items-center justify-center">
                                                    <img src={goldCheck} alt="gold-check" className="w-3 h-3" />
                                                </div>
                                            )}
                                            {!checkDiaryForDate(date) && date <= today && (
                                                <div className="mt-1 flex items-center justify-center">
                                                    <img src={redCross} alt="red-cross" className="w-3 h-3" />
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div> */}
                        </div>
                    </div>

                    <div className="mt-4 bg-[#333333] p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-medium">Сегодня</h2>
                            <button onClick={handleToggleDiaryToday}>
                                <img 
                                    src={arrowDown}
                                    alt="arrow-down"
                                    className={`w-4 h-4 transition-transform duration-300 ${isOpenToday ? "rotate-180" : ""}`}
                                />
                            </button>
                        </div>
                        {isOpenToday && (
                            <div className="mt-3 space-y-3">
                                <div className="p-2 border border-white/40 rounded-lg">
                                    <p className="text-sm font-medium">Открытия</p>
                                    <textarea 
                                        name="discovery"
                                        value={diary.discovery}
                                        onChange={handleChange}
                                        className="w-full mt-1 bg-transparent text-white focus:outline-none focus:border-white/80 overflow-y-scroll"
                                        placeholder="Что нового вы открыли для себя сегодня?"
                                        rows={1}
                                        style={{
                                            minHeight: "2.5rem",
                                            maxHeight: "7.5rem"
                                        }}
                                        onInput={e => {
                                            const target = e.target as HTMLTextAreaElement;
                                            target.style.height = "2.5rem";
                                            target.style.height = Math.min(target.scrollHeight, 7.5 * 16) + "px";
                                        }}
                                    />
                                </div>
                                <div className="p-2 border border-white/40 rounded-lg">
                                    <p className="text-sm font-medium">Достижения</p>
                                    <textarea 
                                        name="achievement" 
                                        value={diary.achievement} 
                                        onChange={handleChange} 
                                        className="w-full mt-1 bg-transparent text-white focus:outline-none focus:border-white/80 overflow-y-scroll" 
                                        placeholder="Что нового вы достигли сегодня?"
                                        rows={1}
                                        style={{
                                            minHeight: "2.5rem",
                                            maxHeight: "7.5rem"
                                        }}
                                        onInput={e => {
                                            const target = e.target as HTMLTextAreaElement;
                                            target.style.height = "2.5rem";
                                            target.style.height = Math.min(target.scrollHeight, 7.5 * 16) + "px";
                                        }}
                                    />
                                </div>
                                <div className="p-2 border border-white/40 rounded-lg">
                                    <p className="text-sm font-medium">Благодарности</p>
                                    <textarea 
                                        name="gratitude" 
                                        value={diary.gratitude} 
                                        onChange={handleChange} 
                                        className="w-full mt-1 bg-transparent text-white focus:outline-none focus:border-white/80 overflow-y-scroll" 
                                        placeholder="Кому и за что вы благодарны сегодня?"
                                        rows={1}
                                        style={{
                                            minHeight: "2.5rem",
                                            maxHeight: "7.5rem"
                                        }}
                                        onInput={e => {
                                            const target = e.target as HTMLTextAreaElement;
                                            target.style.height = "2.5rem";
                                            target.style.height = Math.min(target.scrollHeight, 7.5 * 16) + "px";
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">Бесполезное упражнение</p>
                                    <Switch
                                        checked={diary.uselessTask}
                                        onChange={() => setDiary({ ...diary, uselessTask: !diary.uselessTask })}
                                        className=""
                                    />

                                </div>
                            </div>
                        )}
                    </div>
                    {isOpenToday && (
                        <div className="mt-3">
                            <RedButton text={todayDiaryId ? "Обновить" : "Сохранить"} onClick={handleSubmit} className="w-full" disabled={loading} />
                        </div>
                    )}

                    {diaries.length > 0 && (
                        <div className="mt-3">
                            {diaries.map((diary: any) => (
                                <div key={diary._id} className="mt-4 bg-[#333333] p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-medium">
                                            {diary.createdAt.split('T')[0] === new Date().toISOString().split('T')[0] ? 'Сегодня' : new Date(diary.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </h2>
                                        <button onClick={() => { setDiaries(diaries.map((d: any) => ({ ...d, isOpen: d._id === diary._id ? !d.isOpen : d.isOpen }))); }}>
                                            <img 
                                                src={arrowDown}
                                                alt="arrow-down"
                                                className={`w-4 h-4 transition-transform duration-300 ${diary.isOpen ? "rotate-180" : ""}`}
                                            />
                                        </button>
                                    </div>
                                    {diary.isOpen && (
                                        <div className="mt-3 space-y-3">
                                            <div className="p-2 border border-white/40 rounded-lg max-h-[100px] overflow-y-scroll">
                                                <p className="text-sm font-medium">Открытия</p>
                                                <p className="mt-1.5">{diary.discovery}</p>
                                            </div>
                                            <div className="p-2 border border-white/40 rounded-lg max-h-[100px] overflow-y-scroll">
                                                <p className="text-sm font-medium">Достижения</p>
                                                <p className="mt-1.5">{diary.achievement}</p>
                                            </div>
                                            <div className="p-2 border border-white/40 rounded-lg max-h-[100px] overflow-y-scroll">
                                                <p className="text-sm font-medium">Благодарности</p>
                                                <p className="mt-1.5">{diary.gratitude}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium">Бесполезное упражнение</p>
                                                <div className={`px-2 py-1 rounded ${diary.uselessTask ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                    {diary.uselessTask ? 'Да' : 'Нет'}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </UserLayout>
        </div>
    )
}