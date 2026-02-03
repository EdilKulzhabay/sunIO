import { useEffect, useState, useRef } from "react";
import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import api from "../../api";
import { ClientSubscriptionDynamicModal } from "../../components/User/ClientSubscriptionDynamicModal";
import { useNavigate } from "react-router-dom";

interface TransitEntity {
    _id: string;
    startDate: string | Date;
    endDate: string | Date;
    title: string;
    subtitle?: string;
    image?: string;
    lines: any[];
    accessType: string;
}

export const ClientTransitsList = () => {
    const [transits, setTransits] = useState<TransitEntity[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [userHasPaid, setUserHasPaid] = useState(false);
    const navigate = useNavigate();
    const [content, setContent] = useState<string>('');
    const activeTransitRef = useRef<HTMLDivElement | null>(null);
    
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

        fetchTransits();
        fetchContent();
        fetchUserPaymentStatus();
    }, []);

    // Скролл к активному транзиту после загрузки данных
    useEffect(() => {
        if (!loading && transits.length > 0 && activeTransitRef.current) {
            // Небольшая задержка для завершения рендеринга
            setTimeout(() => {
                activeTransitRef.current?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 100);
        }
    }, [loading, transits]);

    const fetchContent = async () => {
        const response = await api.get('/api/dynamic-content/name/transit-subscription');
        setContent(response.data.data.content);
    }

    const fetchUserPaymentStatus = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userData = JSON.parse(userStr);
                if (userData._id) {
                    const response = await api.post('/api/user/profile', { userId: userData._id });
                    if (response.data && response.data.success && response.data.user) {
                        setUserHasPaid(response.data.user.hasPaid && response.data.user.subscriptionEndDate && new Date(response.data.user.subscriptionEndDate) > new Date());
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки статуса оплаты:', error);
        }
    };

    const isTransitActive = (transit: TransitEntity): boolean => {
        const now = new Date();
        
        const start = typeof transit.startDate === 'string' ? new Date(transit.startDate) : transit.startDate;
        const end = typeof transit.endDate === 'string' ? new Date(transit.endDate) : transit.endDate;
        
        return start <= now && end >= now;
    };

    const fetchTransits = async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/transit");
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                // Сортируем: сначала по дате начала, затем активные первыми
                const sortedTransits = [...response.data.data].sort((a, b) => {
                    const aStart = typeof a.startDate === 'string' ? new Date(a.startDate) : a.startDate;
                    const bStart = typeof b.startDate === 'string' ? new Date(b.startDate) : b.startDate;
                    
                    // Сначала сортируем по дате начала (от более ранних к более поздним)
                    const dateDiff = aStart.getTime() - bStart.getTime();
                    if (dateDiff !== 0) {
                        return dateDiff;
                    }
                    
                    // Если даты одинаковые, активные первыми
                    const aActive = isTransitActive(a);
                    const bActive = isTransitActive(b);
                    if (aActive && !bActive) return -1;
                    if (!aActive && bActive) return 1;
                    return 0;
                });
                setTransits(sortedTransits);
            }
        } catch (error) {
            console.error("Failed to fetch transits", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateRange = (startDate: string | Date, endDate: string | Date): string => {
        const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
        const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
        
        const year = start.getFullYear();
        const startDay = start.getDate();
        const endDay = end.getDate();
        
        const monthNames = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];
        
        const startMonth = monthNames[start.getMonth()];
        const endMonth = monthNames[end.getMonth()];
        
        return `${year}: ${startDay} ${startMonth} — ${endDay} ${endMonth}`;
    };

    const handleTransitClick = async (transit: TransitEntity) => {
        // Проверяем, активен ли транзит (startDate <= currentDate <= endDate)
        const isActive = isTransitActive(transit);
        
        if (isActive) {
            // Если транзит активен, показываем его сразу
            navigate(`/client/transit/${transit._id}`);
        } else {
            if (!userHasPaid) {
                // Показываем модальное окно подписки
                setShowModal(true);
            } else {
                // Если есть подписка, показываем транзит
                navigate(`/client/transit/${transit._id}`);
            }
        }
    };

    return (
        <UserLayout>
            <BackNav title="Все транзиты" />
            <div className="px-4 mt-2 pb-10 bg-[#161616]">
                {loading ? (
                    <div className="text-center py-8">
                        <p className="text-white/60">Загрузка...</p>
                    </div>
                ) : transits.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-white/60">Нет транзитов</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transits.map((transit) => {
                            const isActive = isTransitActive(transit);
                            return (
                                <div
                                    key={transit._id}
                                    ref={isActive ? activeTransitRef : null}
                                    onClick={() => handleTransitClick(transit)}
                                    className="bg-[#333333] rounded-lg p-4 cursor-pointer hover:bg-[#3a3a3a] transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-medium text-white">{formatDateRange(transit.startDate, transit.endDate)}</h3>
                                            <p className="text-sm text-white/60 mt-1">
                                                {transit.title}
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
        </UserLayout>
    );
};

