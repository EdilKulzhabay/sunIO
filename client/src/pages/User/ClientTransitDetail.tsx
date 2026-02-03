import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import api from "../../api";
import { formatDateRangeReadable } from "../../components/User/dateUtils";
import { MobileAccordionList } from "../../components/User/MobileAccordionList";

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

export const ClientTransitDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [transit, setTransit] = useState<TransitEntity | null>(null);
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
            fetchTransit(id);
        }
    }, [id]);

    const fetchTransit = async (transitId: string) => {
        setLoading(true);
        try {
            const response = await api.get(`/api/transit/${transitId}`);
            if (response.data && response.data.success && response.data.data) {
                setTransit(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch transit", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <UserLayout>
                <BackNav title="Транзит" />
                <div className="px-4 mt-4 pb-10">
                    <p className="text-white/60">Загрузка...</p>
                </div>
            </UserLayout>
        );
    }

    if (!transit) {
        return (
            <UserLayout>
                <BackNav title="Транзит" />
                <div className="px-4 mt-4 pb-10">
                    <p className="text-white/60">Транзит не найден</p>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <BackNav title="Описание транзитов" />
            <div className="px-4 mt-2 pb-10 bg-[#161616]">
                <div className="mt-4">
                    <p className="text-xl font-semibold">
                        {formatDateRangeReadable(transit.startDate, transit.endDate)}
                    </p>
                    <h2 className="text-2xl mt-3">{transit.title}</h2>
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
            </div>
        </UserLayout>
    );
};

