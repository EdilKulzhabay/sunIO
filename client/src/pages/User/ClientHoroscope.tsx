import { UserLayout } from "../../components/User/UserLayout"
import { BackNav } from "../../components/User/BackNav"
import { useState, useEffect } from "react"
import api from "../../api"
import { formatDateRangeDDMM } from "../../components/User/dateUtils"
import { MobileAccordionList } from "../../components/User/MobileAccordionList"
import { RedButton } from "../../components/User/RedButton"
import { useNavigate } from "react-router-dom"

export const ClientHoroscope = () => {
    const [horoscope, setHoroscope] = useState<any>(null);
    const navigate = useNavigate();
    const [content, setContent] = useState<string>('');
    const [screenHeight, setScreenHeight] = useState(0);
    const [safeAreaTop, setSafeAreaTop] = useState(0);
    const [safeAreaBottom, setSafeAreaBottom] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchContent = async () => {
        const response = await api.get('/api/dynamic-content/name/horoscope-desc');
        setContent(response.data.data.content);
    }

    const fetchHoroscope = async () => {
        try {
            const response = await api.get('/api/horoscope/current');
            const data = response.data.data;
            if (data) {
                setHoroscope(data);
            }
        } catch (error) {
            console.error('Ошибка загрузки гороскопа', error);
        } finally {
            setLoading(false);
        }
    }

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

        fetchHoroscope();
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
                <div className="">
                    <BackNav title="Антисоциумный гороскоп" />
                    <div className="px-4 mt-2">
                        <p dangerouslySetInnerHTML={{ __html: content }}></p>
                        {horoscope && (
                            <div className="mt-4">
                                <p className="text-sm">
                                    {formatDateRangeDDMM(horoscope.startDate, horoscope.endDate)}
                                </p>
                                <h2 className="text-xl font-medium">{horoscope.title}</h2>
                            </div>
                        )}
                    </div>
                    {horoscope?.image && (
                        <div className="mt-3 relative">
                            <div className="relative flex justify-center">
                                <img src={`${import.meta.env.VITE_API_URL}${horoscope.image}`} alt={horoscope.title} className="w-full lg:w-1/2  h-auto rounded-lg object-cover z-10" />
                            </div>
                            <div 
                                    className="absolute inset-0 z-10"
                                    style={{
                                        background: 'linear-gradient(to bottom, #161616 0%, #16161600 30%)',
                                    }}
                                />
                                <div 
                                    className="absolute inset-0 z-10"
                                    style={{
                                        background: 'linear-gradient(to bottom, #16161600 70%, #161616 100%)',
                                    }}
                                />
                        </div>
                    )}
                    {horoscope && (
                        <div className="px-4 mt-8">
                            {horoscope.lines && horoscope.lines.length > 0 && (
                                <MobileAccordionList items={horoscope.lines} />
                            )}
                        </div>
                    )}
                    {!horoscope && (
                        <div className="px-4 mt-8">
                            <h2 className="text-2xl font-bold">Нет данных</h2>
                            <p className="text-gray-600">Нет данных для текущего дня</p>
                        </div>
                    )}
                </div>

                <div className="px-4 mt-auto pt-8 space-y-3 pb-10 lg:hidden">
                    <a
                        href="https://tochka.li/signs"
                        target="_blank"
                        className="w-full block border border-[#FFC293] text-[#FFC293] py-2.5 text-center font-medium rounded-full"
                    >
                        Подробнее об энергии на Точке Знаки
                    </a>
                    <RedButton
                        text="Посмотреть все гороскопы"
                        onClick={() => navigate('/client/horoscopes')}
                        className="w-full"
                    />
                </div>
                <div className="hidden lg:flex justify-end items-center gap-x-3 lg:pb-10 lg:mt-4">
                    <a
                        href="https://tochka.li/signs"
                        target="_blank"
                        className="block border px-4 border-[#FFC293] text-[#FFC293] py-2.5 text-center font-medium rounded-full"
                    >
                        Подробнее об энергии на Точке Знаки
                    </a>
                    <RedButton
                        text="Посмотреть все гороскопы"
                        onClick={() => navigate('/client/horoscopes')}
                        className="px-4"
                    />
                </div>
            </div>
        </UserLayout>
    )
}
