import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

export const ClientDepositLog = () => {
    const [userData, setUserData] = useState<any>(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [depositLog, setDepositLog] = useState<any[]>([]);

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
        fetchDepositLog();
    }, [navigate]);

    const fetchDepositLog = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user?._id) return;
            const response = await api.get(`/api/operation-logs/client/${user._id}/deposits`);
            if (response.data.success) {
                setDepositLog(response.data.data || []);
            }
        } catch (error) {
            console.error('Ошибка загрузки истории пополнений:', error);
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400/90" />
            </div>
        );
    }

    return (
        <div>
            <UserLayout>
                <BackNav title="История пополнений" />
                <div className="flex-1 px-4 space-y-3">
                    {depositLog && depositLog.length > 0 && depositLog.map((deposit) => (
                        <div 
                        key={deposit._id}
                        className="bg-[#114E50] rounded-xl p-4"
                    >
                        <div className="text-white/60 text-sm">
                            {formatDate(deposit.createdAt)}, ID {deposit.invId} 
                        </div>
                        <div className="mt-1 text-white font-medium">
                            <div>{deposit.amount.toLocaleString('ru-RU')} руб.</div>
                        </div>
                    </div>
                    ))}
                </div>
            </UserLayout>
        </div>
    );
};