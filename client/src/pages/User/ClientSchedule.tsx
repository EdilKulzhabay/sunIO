import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import { DateRangeCalendar } from "../../components/User/DateRangeCalendar";
import { useEffect, useState } from "react";
import api from "../../api";
import { Switch } from "../../components/User/Switch";
import { X } from 'lucide-react';
import copyLink from '../../assets/copyLink.png';
import { toast } from "react-toastify";
import { RedButton } from "../../components/User/RedButton";

export const ClientSchedule = () => {
    const [userData, setUserData] = useState<any>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [schedules, setSchedules] = useState<any>([]);
    const [calendarSchedules, setCalendarSchedules] = useState<any[]>([]);
    const [eventDateBorders, setEventDateBorders] = useState<Record<string, string>>({});
    const [eventDateDots, setEventDateDots] = useState<Record<string, string>>({});
    const [showAllEvents, setShowAllEvents] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchUserData = async (id: string) => {
        const response = await api.get(`/api/user/${id}`);
        if (response.data.success) {
            setUserData(response.data.data);
        }
    }

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        console.log(startDate, endDate);
        if (userStr) {
            const id = JSON.parse(userStr)._id;
            fetchUserData(id);
        }
    }, []);
    
    const formatDate = (date: Date | null) => {
        if (!date) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`; // DD.MM.YYYY
    };

    const handleDateRangeSelect = (start: Date | null, end: Date | null) => {
        setStartDate(start);
        setEndDate(end);
    };

    // Загружаем все события при монтировании компонента
    useEffect(() => {
        // Проверка на блокировку пользователя
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.isBlocked && user.role !== 'admin') {
                    window.location.href = '/client/blocked-user';
                    return;
                }
            } catch (e) {
                console.error('Ошибка парсинга user из localStorage:', e);
            }
        }

        fetchAllSchedulesForCalendar();
    }, []);

    const fetchAllSchedulesForCalendar = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const futureDate = new Date(today);
            futureDate.setDate(futureDate.getFullYear() + 100);
            
            const formattedStart = formatDate(today);
            const formattedEnd = formatDate(futureDate);
            
            const response = await api.get(`/api/schedule?startDate=${formattedStart}&endDate=${formattedEnd}`);
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                setCalendarSchedules(response.data.data);
            }
        } catch (error) {
            console.error('Ошибка загрузки всех событий:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!calendarSchedules.length) {
            setEventDateBorders({});
            setEventDateDots({});
            return;
        }

        const subscribedIds = new Set(
            userData?.scheduleSubscriptions?.map((subscription: any) => subscription.scheduleId) || []
        );

        const borderMap: Record<string, string> = {};
        const dotMap: Record<string, string> = {};

        const markDate = (date: Date, borderColor: string | null, dotColor: string) => {
            const key = date.toISOString().split('T')[0];
            if (borderColor) {
                borderMap[key] = borderColor;
            }
            if (dotMap[key] !== '#EC1313') {
                dotMap[key] = dotColor;
            }
        };

        calendarSchedules.forEach((schedule: any) => {
            const isSubscribed = subscribedIds.has(schedule._id);
            const borderColor = isSubscribed ? (schedule.priority ? '#EC1313' : '#FFC293') : null;
            const dotColor = schedule.priority ? '#EC1313' : '#FFC293';

            if (schedule.startDate && schedule.endDate) {
                const start = new Date(schedule.startDate);
                const end = new Date(schedule.endDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                getDatesBetween(start, end).forEach((date) => markDate(date, borderColor, dotColor));
            } else if (schedule.startDate) {
                const start = new Date(schedule.startDate);
                start.setHours(0, 0, 0, 0);
                markDate(start, borderColor, dotColor);
            } else if (schedule.endDate) {
                const end = new Date(schedule.endDate);
                end.setHours(0, 0, 0, 0);
                markDate(end, borderColor, dotColor);
            }
        });

        setEventDateBorders(borderMap);
        setEventDateDots(dotMap);
    }, [calendarSchedules, userData]);

    // Функция для получения всех дат между startDate и endDate
    const getDatesBetween = (start: Date, end: Date): Date[] => {
        const dates: Date[] = [];
        const currentDate = new Date(start);
        currentDate.setHours(0, 0, 0, 0);
        const endDate = new Date(end);
        endDate.setHours(0, 0, 0, 0);
        
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
    };

    useEffect(() => {
        fetchSchedules();
    }, [showAllEvents]);

    const fetchSchedules = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const futureDate = new Date(today);
            futureDate.setDate(futureDate.getFullYear() + 1);
            const formattedStart = formatDate(today);
            const formattedEnd = formatDate(futureDate);
            const response = await api.get(`/api/schedule?startDate=${formattedStart}&endDate=${formattedEnd}`);
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                if (showAllEvents) {
                    setSchedules(response.data.data);
                } else {
                    // Получаем все schedule с priority === true
                    const prioritySchedules = response.data.data.filter((schedule: any) => schedule.priority === true);
                    // Получаем те, у которых priority === false и дата события не больше недели от today
                    const oneWeekLater = new Date(today);
                    oneWeekLater.setDate(today.getDate() + 7);

                    const normalSchedules = response.data.data.filter((schedule: any) => {
                        if (schedule.priority === true) return false;
                        
                        // Проверяем startDate, endDate, eventDate на попадание в диапазон
                        const datesToCheck: (string | undefined)[] = [schedule.startDate, schedule.endDate];
                        return datesToCheck.some(dateString => {
                            if (!dateString) return false;
                            const d = new Date(dateString);
                            d.setHours(0,0,0,0);
                            return d >= today && d <= oneWeekLater;
                        });
                    });

                    // Сортируем по дате (startDate)
                    const allSchedules = [...prioritySchedules, ...normalSchedules];
                    allSchedules.sort((a: any, b: any) => {
                        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
                        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
                        return dateA - dateB;
                    });
                    setSchedules(allSchedules);
                }
            } else {
                setSchedules([]);
            }
        } catch (error) {
            console.error('Ошибка загрузки событий:', error);
            setSchedules([]);
        }
    }

    const handleScheduleClick = (schedule: any) => {
        setSelectedSchedule(schedule);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedSchedule(null);
    };

    const copyEventLink = () => {
        navigator.clipboard.writeText(selectedSchedule?.eventLink || '');
        toast.success('Ссылка на событие скопирована!');
    }

    const handleParticipatingChange = async () => {
        if (userData) {
            const scheduleId = selectedSchedule._id;
            let scheduleSubscriptions = userData.scheduleSubscriptions;
            if (scheduleSubscriptions.some((subscription: any) => subscription.scheduleId === scheduleId)) {
                scheduleSubscriptions = scheduleSubscriptions.filter((subscription: any) => subscription.scheduleId !== scheduleId);
            } else {
                scheduleSubscriptions.push({ scheduleId });
            }
            const response = await api.put(`/api/user/${userData._id}`, {
                scheduleSubscriptions: scheduleSubscriptions,
            });
            if (response.data.success) {
                setUserData(response.data.data);
            }
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#031F23]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <UserLayout>
            <BackNav title="Расписание" />
            <div className="px-4 mt-2 pb-10 bg-[#031F23] lg:flex lg:gap-x-4">
                <div className="lg:basis-1/3">
                    <DateRangeCalendar 
                        onDateRangeSelect={handleDateRangeSelect}
                        selectedStartDate={null}
                        selectedEndDate={null}
                        eventDateBorders={eventDateBorders}
                        eventDateDots={eventDateDots}
                    />
                </div>
                <div className="lg:basis-2/3">
                    <div className="mt-6 lg:mt-0 flex items-center justify-between">
                        <div className="text-white/60">{new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                        <div className="flex items-center gap-x-3">
                            <div className="text-white/60">Все меропрития</div>
                            <Switch
                                checked={showAllEvents}
                                onChange={() => setShowAllEvents(!showAllEvents)}
                            />
                        </div>
                    </div>
                    <div className="mt-4 space-y-4">
                        {schedules.length > 0 && schedules.map((schedule: any) => (
                            <div 
                                key={schedule._id}
                                className="bg-[#114E50] rounded-lg p-4 cursor-pointer hover:bg-[#3a3a3a] transition-colors"
                                onClick={() => handleScheduleClick(schedule)}
                            >
                                <div onClick={() => {}} className="flex items-center justify-between">
                                    <h1 className="text-xl font-medium">{schedule?.eventTitle}</h1>
                                    {schedule.priority && <div className="w-1.5 h-1.5 bg-[#C4841D] rounded-full" />}
                                    {!schedule.priority && <div className="w-1.5 h-1.5 bg-[#FFC293] rounded-full" />}
                                </div>
                                <p dangerouslySetInnerHTML={{ __html: schedule?.description || '' }}></p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Модальное окно для добавления в календарь */}
                {isModalOpen && selectedSchedule && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        {/* Мобильная версия: модальное окно снизу */}
                        <div className="flex items-end justify-center min-h-screen sm:hidden">
                            {/* Overlay */}
                            <div 
                                className="fixed inset-0 bg-black/60 transition-opacity z-20"
                                onClick={closeModal}
                            />

                            {/* Modal - снизу на мобильных */}
                            <div 
                                className="relative z-50 px-4 pt-6 pb-8 inline-block w-full bg-[#114E50] rounded-t-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={closeModal}
                                    className="absolute top-6 right-5 cursor-pointer"
                                >
                                    <X size={24} />
                                </button>
                                <div 
                                    className="[&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_div]:mb-2 [&_span]:font-bold" 
                                    dangerouslySetInnerHTML={{ __html: selectedSchedule.eventTitle || 'Добавить в календарь' }} 
                                />
                                <div className="mt-4">
                                    {selectedSchedule.description && (
                                        <p className="mb-2" dangerouslySetInnerHTML={{ __html: selectedSchedule.description || '' }}></p>
                                    )}
                                    {selectedSchedule.startDate && (
                                        <p className="text-sm text-white/60">
                                            Дата начала: {new Date(selectedSchedule.startDate).toLocaleString('ru-RU', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    )}
                                    {selectedSchedule.endDate && (
                                        <p className="text-sm text-white/60">
                                            Дата окончания: {new Date(selectedSchedule.endDate).toLocaleString('ru-RU', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    )}
                                </div>
                                <button onClick={copyEventLink} className="bg-white/10 block w-full mt-4 rounded-lg py-3 px-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <div>Ссылка на событие:</div>
                                        <div>
                                            <img src={copyLink} alt="copy" className="w-5 h-5 object-cover" />
                                        </div>
                                    </div>
                                    <div className="mt-1 text-left">{selectedSchedule?.eventLink}</div>
                                </button>
                                <div className="mt-4 flex items-center justify-between">
                                    <div>Участвую</div>
                                    <Switch checked={userData?.scheduleSubscriptions?.some((subscription: any) => subscription.scheduleId === selectedSchedule._id)} onChange={handleParticipatingChange} />
                                </div>
                                <button
                                    onClick={() => {
                                        if (selectedSchedule.googleCalendarLink) {
                                            // Открываем ссылку во внешнем браузере через Telegram WebApp API
                                            if (window.Telegram?.WebApp?.openLink) {
                                                window.Telegram.WebApp.openLink(selectedSchedule.googleCalendarLink);
                                            } else {
                                                // Fallback для обычного браузера
                                                window.open(selectedSchedule.googleCalendarLink, '_blank');
                                            }
                                            closeModal();
                                        }
                                    }}
                                    className="mt-4 w-full block border px-4 border-[#FFC293] text-[#FFC293] py-2.5 text-center font-medium rounded-full">
                                    Добавить в календарь Google
                                </button>
                                <RedButton 
                                    text="Добавить в календарь iOS" 
                                    onClick={() => {
                                        if (selectedSchedule.appleCalendarLink) {
                                            // Открываем ссылку во внешнем браузере через Telegram WebApp API
                                            if (window.Telegram?.WebApp?.openLink) {
                                                window.Telegram.WebApp.openLink(selectedSchedule.appleCalendarLink);
                                            } else {
                                                // Fallback для обычного браузера
                                                window.open(selectedSchedule.appleCalendarLink, '_blank');
                                            }
                                            closeModal();
                                        }
                                    }} 
                                    className="w-full mt-4"
                                />
                            </div>
                        </div>
                        {/* Десктопная версия: модальное окно по центру */}
                        <div className="hidden sm:flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                            {/* Overlay */}
                            <div 
                                className="fixed inset-0 bg-black/60 transition-opacity z-20"
                                onClick={closeModal}
                            />

                            {/* Modal - снизу на мобильных */}
                            <div 
                                className="relative z-50 w-1/3 px-4 pt-6 pb-8 inline-block  bg-[#114E50] rounded-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={closeModal}
                                    className="absolute top-6 right-5 cursor-pointer"
                                >
                                    <X size={24} />
                                </button>
                                <div 
                                    className="[&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_div]:mb-2 [&_span]:font-bold" 
                                    dangerouslySetInnerHTML={{ __html: selectedSchedule.eventTitle || 'Добавить в календарь' }} 
                                />
                                <div className="mt-4">
                                    {selectedSchedule.description && (
                                        <p className="mb-2" dangerouslySetInnerHTML={{ __html: selectedSchedule.description || '' }}></p>
                                    )}
                                    {selectedSchedule.startDate && (
                                        <p className="text-sm text-white/60">
                                            Дата начала: {new Date(selectedSchedule.startDate).toLocaleString('ru-RU', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    )}
                                    {selectedSchedule.endDate && (
                                        <p className="text-sm text-white/60">
                                            Дата окончания: {new Date(selectedSchedule.endDate).toLocaleString('ru-RU', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    )}
                                </div>
                                <button onClick={copyEventLink} className="bg-white/10 block w-full mt-4 rounded-lg py-3 px-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <div>Ссылка на событие:</div>
                                        <div>
                                            <img src={copyLink} alt="copy" className="w-5 h-5 object-cover" />
                                        </div>
                                    </div>
                                    <div className="mt-1 text-left">{selectedSchedule?.eventLink}</div>
                                </button>
                                <div className="mt-4 flex items-center justify-between">
                                    <div>Участвую</div>
                                    <Switch checked={userData?.scheduleSubscriptions?.some((subscription: any) => subscription.scheduleId === selectedSchedule._id)} onChange={handleParticipatingChange} />
                                </div>
                                <button
                                    onClick={() => {
                                        if (selectedSchedule.googleCalendarLink) {
                                            // Открываем ссылку во внешнем браузере через Telegram WebApp API
                                            if (window.Telegram?.WebApp?.openLink) {
                                                window.Telegram.WebApp.openLink(selectedSchedule.googleCalendarLink);
                                            } else {
                                                // Fallback для обычного браузера
                                                window.open(selectedSchedule.googleCalendarLink, '_blank');
                                            }
                                            closeModal();
                                        }
                                    }}
                                    className="mt-4 w-full block border px-4 border-[#FFC293] text-[#FFC293] py-2.5 text-center font-medium rounded-full">
                                    Добавить в календарь Google
                                </button>
                                <RedButton 
                                    text="Добавить в календарь iOS" 
                                    onClick={() => {
                                        if (selectedSchedule.appleCalendarLink) {
                                            // Открываем ссылку во внешнем браузере через Telegram WebApp API
                                            if (window.Telegram?.WebApp?.openLink) {
                                                window.Telegram.WebApp.openLink(selectedSchedule.appleCalendarLink);
                                            } else {
                                                // Fallback для обычного браузера
                                                window.open(selectedSchedule.appleCalendarLink, '_blank');
                                            }
                                            closeModal();
                                        }
                                    }} 
                                    className="w-full mt-4"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </UserLayout>
    )
}