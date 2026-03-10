import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

export const ClientPurchaseLog = () => {
    const [userData, setUserData] = useState<any>(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [purchaseLog, setPurchaseLog] = useState<any[]>([]);

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

        fetchUserData();
        fetchPurchaseLog();
    }, [navigate]);

    const fetchPurchaseLog = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user?._id) return;
            const response = await api.get(`/api/operation-logs/client/${user._id}/purchases`);
            if (response.data.success) {
                setPurchaseLog(response.data.data || []);
            }
        } catch (error) {
            console.error('Ошибка загрузки истории покупок:', error);
        }
    };

    const fetchUserData = async () => {
        try {
            if (userData) {
                console.log("1");
            }
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await api.post('/api/user/profile', { userId: user._id }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.success) {
                setUserData(response.data.user);
                // Проверка на блокировку после получения данных с сервера
                if (response.data.user.isBlocked && response.data.user.role !== 'admin') {
                    navigate('/client/blocked-user');
                    return;
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки данных пользователя:', error);
        } finally {
            setLoading(false);
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#031F23]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div>
            <UserLayout>
                <BackNav title="История покупок" />
                <div className="flex-1 px-4 space-y-3">
                    {purchaseLog && purchaseLog.length > 0 && purchaseLog.map((purchase) => (
                        <div 
                            key={purchase._id}
                            className="bg-[#114E50] rounded-xl p-4"
                        >
                            <div className="text-white/60 text-sm">
                                {formatDate(purchase.createdAt)}, {purchase.amount.toLocaleString('ru-RU')} руб.
                            </div>
                            <div className="mt-1 text-white font-medium">
                                <div>{purchase.productTitle}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </UserLayout>
        </div>
    );
};