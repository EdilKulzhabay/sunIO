import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import api from "../../api";
import { formatDateRangeReadable } from "../../components/User/dateUtils";
import { MobileAccordionList } from "../../components/User/MobileAccordionList";

interface HoroscopeLine {
    title: string;
    content: string;
}

interface HoroscopeEntity {
    startDate: string | Date;
    endDate: string | Date;
    title: string;
    subtitle?: string;
    image?: string;
    lines: HoroscopeLine[];
    accessType: string;
}

export const ClientHoroscopeDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [horoscope, setHoroscope] = useState<HoroscopeEntity | null>(null);
    const [loading, setLoading] = useState(true);

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

        if (id) {
            fetchHoroscope(id);
        }
    }, [id]);

    const fetchHoroscope = async (horoscopeId: string) => {
        setLoading(true);
        try {
            const response = await api.get(`/api/horoscope/${horoscopeId}`);
            if (response.data && response.data.success && response.data.data) {
                setHoroscope(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch horoscope", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <UserLayout>
                <BackNav title="Гороскоп" />
                <div className="px-4 mt-4 pb-10">
                    <p className="text-white/60">Загрузка...</p>
                </div>
            </UserLayout>
        );
    }

    if (!horoscope) {
        return (
            <UserLayout>
                <BackNav title="Гороскоп" />
                <div className="px-4 mt-4 pb-10">
                    <p className="text-white/60">Гороскоп не найден</p>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <BackNav title="Антисоциумный гороскоп" />
            <div className="px-4 mt-2 pb-10 bg-[#161616]">
                <p>
                    Социумные гороскопы помогают жить в комфорте для ума, но при этом не дают достичь сверхрезультатов. Когда вы начинаете действовать по врожденной энергии, а не как вам говорит ум, вы начинаете получать сверхрезультаты
                </p>
                {horoscope && (
                    <div className="mt-4 flex items-center justify-between">
                        <h2 className="text-xl font-medium">{horoscope.title}</h2>
                        <p className="text-lg">
                            {formatDateRangeReadable(horoscope.startDate, horoscope.endDate)}
                        </p>
                    </div>
                )}
                {horoscope?.image && (
                    <div className="mt-3 relative">
                        <img 
                            src={`${import.meta.env.VITE_API_URL}${horoscope.image}`} 
                            alt={horoscope.title} 
                            className="w-full h-auto rounded-lg object-cover z-10" 
                        />
                        <div 
                            className="absolute inset-0"
                            style={{
                                background: 'linear-gradient(to bottom, #161616 0%, #16161600 30%)',
                            }}
                        />
                        <div 
                            className="absolute inset-0"
                            style={{
                                background: 'linear-gradient(to bottom, #16161600 70%, #161616 100%)',
                            }}
                        />
                    </div>
                )}
                {horoscope && (
                    <div className="mt-8">
                        {horoscope.lines && horoscope.lines.length > 0 && (
                            <MobileAccordionList items={horoscope.lines} />
                        )}
                    </div>
                )}
            </div>
        </UserLayout>
    );
};

