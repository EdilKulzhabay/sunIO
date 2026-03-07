import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const documents = [
    {
        id: 1,
        name: "Договор Оферты",
        link: "https://www.google.com",
    },
    {
        id: 2,
        name: "Безопасность платежей",
        link: "https://www.google.com",
    },
    {
        id: 3,
        name: "Процесс оплаты",
        link: "https://www.google.com",
    },
    {
        id: 4,
        name: "Условия возврата денежных средств",
        link: "https://www.google.com",
    },
    {
        id: 5,
        name: "Политика обработки перс. данных",
        link: "https://www.google.com",
    },
]

export const ClientDocuments = () => {
    const [userData, setUserData] = useState<any>(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

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
    }, [navigate]);

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
                <BackNav title="Документы" />
                <div className="flex-1 px-4">

                    <div className="text-white">
                    Здесь отображаются операции пополнения баланса приложения (предоплата за услуги), а также история покупок продуктов. Внесённые средства учитываются как внутренний баланс и могут быть использованы исключительно для оплаты услуг внутри приложения
                    </div>

                    <div className="mt-5 space-y-4">
                        {documents.map((document) => (
                            <div key={document.id} className="bg-[#114E50] rounded-xl p-4">
                                <a href={document.link} target="_blank" rel="noopener noreferrer" className="text-white font-medium text-xl">
                                    {document.name}
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </UserLayout>
        </div>
    );
};