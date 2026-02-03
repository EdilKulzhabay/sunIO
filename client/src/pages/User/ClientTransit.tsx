import { useEffect, useState } from "react";
import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import api from "../../api";
import { MobileAccordionList } from "../../components/User/MobileAccordionList";
import { RedButton } from "../../components/User/RedButton";
import { useNavigate } from "react-router-dom";

interface TransitLine {
    title: string;
    content: string;
}

interface TransitEntity {
    startDate: string | Date;
    endDate: string | Date;
    title: string;
    subtitle?: string;
    image?: string;
    lines: TransitLine[];
    accessType: string;
}

export const ClientTransit = () => {
    const [transit, setTransit] = useState<TransitEntity | null>(null);
    const navigate = useNavigate();
    const [content, setContent] = useState<string>('');
    const [screenHeight, setScreenHeight] = useState(0);
    const [safeAreaTop, setSafeAreaTop] = useState(0);
    const [safeAreaBottom, setSafeAreaBottom] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchContent = async () => {
        const response = await api.get('/api/dynamic-content/name/transit-desc');
        setContent(response.data.data.content);
    }

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

        fetchTransit();
        fetchContent();
    }, []);

    useEffect(() => {
        const updateScreenHeight = () => {
            const height = window.innerHeight;
            setScreenHeight(height);
            
            // Получаем значения CSS переменных и преобразуем в числа
            const root = document.documentElement;
            const computedStyle = getComputedStyle(root);
            const safeTop = computedStyle.getPropertyValue('--tg-safe-top') || '0px';
            const safeBottom = computedStyle.getPropertyValue('--tg-safe-bottom') || '0px';
            
            // Преобразуем '0px' в число (убираем 'px' и парсим)
            const topValue = parseInt(safeTop.replace('px', '')) || 0;
            const bottomValue = parseInt(safeBottom.replace('px', '')) || 0;
            const addPadding = topValue > 0 ? 40 : 0;
            
            setSafeAreaTop(topValue + addPadding);
            setSafeAreaBottom(bottomValue);
        }
        updateScreenHeight();
        window.addEventListener('resize', updateScreenHeight);
        return () => {
            window.removeEventListener('resize', updateScreenHeight);
        };
    }, []);

    const fetchTransit = async () => {
        try {
            const response = await api.get("/api/transit/current");
            const data: TransitEntity = response.data?.data;
            if (data) {
                setTransit(data);
            }
        } catch (error) {
            console.error("Failed to fetch transit", error);
            setTransit(null);
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
        
        return `${year}: ${startDay} ${startMonth}—${endDay} ${endMonth}`;
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
            <div 
                className="flex flex-col justify-between bg-[#161616]"
                style={{ minHeight: `${screenHeight - (64 + safeAreaTop + safeAreaBottom)}px` }}
            >
                <div className="lg:pb-10">
                    <BackNav title="Описание транзитов" />
                    <div className="px-4 mt-2">
                        <p dangerouslySetInnerHTML={{ __html: content }}></p>
                        {transit && (
                            <div className="mt-4">
                                <p className="text-sm">
                                    {formatDateRange(transit.startDate, transit.endDate)}
                                </p>
                                <h2 className="text-xl font-medium">{transit.title}</h2>
                                {transit.subtitle && (
                                    <h3 className="text-xl mt-2">{transit.subtitle}</h3>
                                )}
                                {transit.image && (
                                    <div className="mt-4">
                                        <img 
                                            src={`${import.meta.env.VITE_API_URL}${transit.image}`} 
                                            alt={transit.title} 
                                            className="w-full h-auto rounded-lg object-cover" 
                                        />
                                    </div>
                                )}
                                <div className="mt-4">
                                    {transit.lines?.length ? (
                                        <MobileAccordionList items={transit.lines} />
                                    ) : (
                                        <p className="mt-4 text-gray-500">Нет контента для выбранной даты.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {!transit && (
                        <div className="px-4 mt-8">
                            <h2 className="text-2xl font-bold">Нет данных</h2>
                            <p className="text-gray-600">Нет записей транзитов для текущего дня</p>
                        </div>
                    )}
                </div>

                <div className="px-4 pt-8 pb-10 lg:hidden">
                    {/* <Link 
                        to="/client/schumann"
                        className="w-full block border border-[#FFC293] text-[#FFC293] py-2.5 text-center font-medium rounded-full"
                    >
                        Посмотреть частоту Шумана
                    </Link> */}
                    <RedButton
                        text="Посмотреть все транзиты"
                        onClick={() => navigate('/client/transits')}
                        className="w-full mt-3"
                    />
                </div>
                <div className="hidden lg:flex justify-end items-center gap-x-3">
                    <RedButton
                        text="Посмотреть все транзиты"
                        onClick={() => navigate('/client/transits')}
                        className="px-4"
                    />
                </div>
            </div>
        </UserLayout>
    );
};
