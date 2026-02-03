import { useEffect, useState } from "react";
import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import api from "../../api";
import { ClientSubscriptionDynamicModal } from "../../components/User/ClientSubscriptionDynamicModal";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

interface HoroscopeEntity {
    _id: string;
    startDate: string | Date;
    endDate: string | Date;
    title: string;
    subtitle?: string;
    image?: string;
    lines: any[];
    accessType: string;
    energyCorridor: boolean;
}

export const ClientHoroscopesList = () => {
    const [horoscopes, setHoroscopes] = useState<HoroscopeEntity[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [userHasPaid, setUserHasPaid] = useState(false);
    const navigate = useNavigate();
    const [content, setContent] = useState<string>('');
    const [corridorsContent, setCorridorsContent] = useState<any | null>(null);
    const [corridorsModalOpen, setCorridorsModalOpen] = useState(false);
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

        fetchHoroscopes();
        fetchUserPaymentStatus();
        fetchContent();
        fetchCorridorsContent();
    }, []);

    const fetchContent = async () => {
        const response = await api.get('/api/dynamic-content/name/horoscope-subscription');
        setContent(response.data.data.content);
    }
    const fetchCorridorsContent = async () => {
        const response = await api.get('/api/dynamic-content/horoscope-corridor');
        setCorridorsContent(response.data.data);
    }

    const fetchUserPaymentStatus = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userData = JSON.parse(userStr);
                if (userData._id) {
                    const response = await api.post('/api/user/profile', { userId: userData._id });
                    if (response.data && response.data.success && response.data.user) {
                        // Проверка на блокировку пользователя после получения данных с сервера
                        if (response.data.user.isBlocked && response.data.user.role !== 'admin') {
                            navigate('/client/blocked-user');
                            return;
                        }
                        setUserHasPaid(response.data.user.hasPaid && response.data.user.subscriptionEndDate && new Date(response.data.user.subscriptionEndDate) > new Date());
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки статуса оплаты:', error);
        }
    };

    const normalizeDate = (date: string | Date): string => {
        if (typeof date === 'string' && date.match(/^\d{2}-\d{2}$/)) {
            return date;
        }
        const d = typeof date === 'string' ? new Date(date) : date;
        return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const fetchHoroscopes = async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/horoscope");
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                // Сначала сортируем все гороскопы по дате начала
                const sortedByStartDate = [...response.data.data].sort((a, b) => {
                    const aStartDate = normalizeDate(a.startDate);
                    const bStartDate = normalizeDate(b.startDate);
                    return compareDates(aStartDate, bStartDate);
                });
                
                // Находим индекс активного гороскопа
                const activeIndex = sortedByStartDate.findIndex(h => isHoroscopeActive(h));
                
                let sortedHoroscopes: HoroscopeEntity[];
                
                if (activeIndex !== -1) {
                    // Если есть активный гороскоп:
                    // Порядок: активный (i), затем i+1 до n, затем 1 до i
                    const activeHoroscope = sortedByStartDate[activeIndex];
                    const afterActive = sortedByStartDate.slice(activeIndex + 1);
                    const beforeActive = sortedByStartDate.slice(0, activeIndex);
                    
                    sortedHoroscopes = [activeHoroscope, ...afterActive, ...beforeActive];
                } else {
                    // Если нет активного гороскопа, просто используем сортировку по дате
                    sortedHoroscopes = sortedByStartDate;
                }
                
                setHoroscopes(sortedHoroscopes);
            }
        } catch (error) {
            console.error("Failed to fetch horoscopes", error);
        } finally {
            setLoading(false);
        }
    };

    // Функция для сравнения дат в формате MM-DD
    // Возвращает: -1 если date1 < date2, 0 если равны, 1 если date1 > date2
    // Для простоты используем строковое сравнение (работает корректно для MM-DD)
    const compareDates = (date1: string, date2: string): number => {
        return date1.localeCompare(date2);
    };

    const isHoroscopeActive = (horoscope: HoroscopeEntity): boolean => {
        const now = new Date();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const currentDay = String(now.getDate()).padStart(2, '0');
        const currentDate = `${currentMonth}-${currentDay}`;
        
        // Даты хранятся в формате MM-DD (например, "03-21")
        const startDate = typeof horoscope.startDate === 'string' 
            ? horoscope.startDate 
            : `${String(new Date(horoscope.startDate).getMonth() + 1).padStart(2, '0')}-${String(new Date(horoscope.startDate).getDate()).padStart(2, '0')}`;
        
        const endDate = typeof horoscope.endDate === 'string' 
            ? horoscope.endDate 
            : `${String(new Date(horoscope.endDate).getMonth() + 1).padStart(2, '0')}-${String(new Date(horoscope.endDate).getDate()).padStart(2, '0')}`;
        
        // Проверяем, попадает ли текущая дата в диапазон
        // Учитываем случай, когда период переходит через конец года (например, 12-22 до 01-20)
        if (startDate <= endDate) {
            // Обычный случай (например, 03-21 до 04-20)
            return currentDate >= startDate && currentDate <= endDate;
        } else {
            // Период переходит через конец года (например, 12-22 до 01-20)
            return currentDate >= startDate || currentDate <= endDate;
        }
    };

    const handleHoroscopeClick = async (horoscope: HoroscopeEntity) => {
        // Проверяем, активен ли гороскоп (startDate <= currentDate <= endDate)
        if (horoscope?.energyCorridor && horoscope?.energyCorridor === true) {
            setCorridorsModalOpen(true);
            return;
        }
        const isActive = isHoroscopeActive(horoscope);
        
        if (isActive) {
            // Если гороскоп активен, показываем его сразу
            navigate(`/client/horoscope/${horoscope._id}`);
        } else {
            
            if (!userHasPaid) {
                // Показываем модальное окно подписки
                setShowModal(true);
            } else {
                // Если есть подписка, показываем гороскоп
                navigate(`/client/horoscope/${horoscope._id}`);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#161616]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <UserLayout>
            <BackNav title="Все гороскопы" />
            <div className="px-4 mt-2 pb-10 bg-[#161616]">
                {loading ? (
                    <div className="text-center py-8">
                        <p className="text-white/60">Загрузка...</p>
                    </div>
                ) : horoscopes.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-white/60">Нет гороскопов</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {horoscopes.map((horoscope) => {
                            const isActive = isHoroscopeActive(horoscope);
                            return (
                                <div
                                    key={horoscope._id}
                                    onClick={() => handleHoroscopeClick(horoscope)}
                                    className="bg-[#333333] rounded-lg p-4 cursor-pointer hover:bg-[#3a3a3a] transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-medium text-white">{horoscope.title}</h3>
                                            <p className="text-sm text-white/60 mt-1">
                                                {horoscope.subtitle}
                                            </p>
                                        </div>
                                        {isActive && (
                                            <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                                                Активен
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <ClientSubscriptionDynamicModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                content={content}
                accessType={"subscription"}
            />
            {corridorsModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    {/* Мобильная версия: модальное окно снизу */}
                    <div className="flex items-end justify-center min-h-screen sm:hidden">
                        {/* Overlay */}
                        <div 
                            className="fixed inset-0 bg-black/60 transition-opacity z-20"
                            onClick={() => setCorridorsModalOpen(false)}
                        />
        
                        {/* Modal - снизу на мобильных */}
                        <div 
                            className="relative z-50 px-4 pt-6 pb-8 inline-block w-full bg-[#333333] rounded-t-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setCorridorsModalOpen(false)}
                                className="absolute top-6 right-5 cursor-pointer"
                            >
                                <X size={24} />
                            </button>
                            <div 
                                className="text-white" 
                            >
                                <h3 className="text-xl lg:text-2xl font-bold mb-2" dangerouslySetInnerHTML={{ __html: corridorsContent?.['horoscope-corridor-title'] ?? '' }}></h3>
                                <p className="mt-4 font-bold" dangerouslySetInnerHTML={{ __html: corridorsContent?.['horoscope-corridor-subtitle'] ?? '' }}></p>
                                <p className="mt-1 text-sm" dangerouslySetInnerHTML={{ __html: corridorsContent?.['horoscope-corridor-content'] ?? '' }}></p>
                            </div>
                            <a 
                                className="block bg-[#EC1313] text-white py-2.5 text-center font-medium rounded-full mt-4 w-full" 
                                href={corridorsContent?.['horoscope-corridor-link'] ?? '#'} 
                                target="_blank"
                            >
                                <p dangerouslySetInnerHTML={{ __html: corridorsContent?.['horoscope-corridor-link-text'] ?? '' }}></p>
                            </a>
                        </div>
                    </div>
        
                    {/* Десктопная версия: модальное окно по центру */}
                    <div className="hidden sm:flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                        {/* Overlay */}
                        <div 
                            className="fixed inset-0 bg-black/60 transition-opacity"
                            onClick={() => setCorridorsModalOpen(false)}
                        />
        
                        {/* Modal - по центру на десктопе */}
                        <div 
                            className="relative p-8 inline-block align-middle bg-[#333333] rounded-lg text-left text-white overflow-hidden shadow-xl transform transition-all"
                            style={{ maxWidth: '700px', width: '100%' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setCorridorsModalOpen(false)}
                                className="absolute top-8 right-8 cursor-pointer"
                            >
                                <X size={32} />
                            </button>
                            <div className="text-white">
                                <h3 className="text-xl lg:text-2xl font-bold mb-2">ЧТО ТАКОЕ КОРИДОРЫ?</h3>
                                <p className="mt-4 font-bold">
                                    Временные периоды, которые наделяют человека, рождённого в них, особыми качествами.
                                </p>
                                <p className="mt-1 text-sm">
                                    Когда вы знаете особенности энергии того или иного коридора (диапазон дат) или сверхдаты (один день), то вы сможете достигать сверх результатов даже не будучи рождёнными в это время. Красота этой технологии в том, что вы можете проявлять любую антисоциумную энергию, которая активна на текущую дату. Как это сделать, какие условия активации этой энергии в вас, а также подводные камни вы узнаете на онлайн Точке «Знаки»
                                </p>
                            </div>
                            <a 
                                className="block bg-[#EC1313] text-white py-2.5 text-center font-medium rounded-full mt-4 w-full" 
                                href="https://tochka.li/signs" 
                                target="_blank"
                            >
                                Подробнее о Точке «Знаки»
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </UserLayout>
    );
};

