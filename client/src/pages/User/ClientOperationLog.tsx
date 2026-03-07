import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import needMoney from "../../assets/needMoney.png";
import { MyLink } from "../../components/User/MyLink";
import arrowDown from "../../assets/arrowDown.png";

export const ClientOperationLog = () => {
    const [userData, setUserData] = useState<any>(null);
    const navigate = useNavigate();
    const [screenHeight, setScreenHeight] = useState(0);
    const [safeAreaTop, setSafeAreaTop] = useState(0);
    const [safeAreaBottom, setSafeAreaBottom] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isPurchasesOpen, setIsPurchasesOpen] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);

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

    useEffect(() => {
        setPurchases([
            {
                id: 1,
                date: "07.03.2026",
                amount: 1000,
                product: "Продукт 1",
                type: "пополнение",
                status: "успешно",
            },
            {
                id: 2,
                date: "16.02.2026",
                amount: 4000,
                product: "Продукт 2",
                type: "пополнение",
                status: "успешно",
            },
        ]);
        setHistory([
            {
                id: 1,
                date: "07.03.2026",
                amount: 12000,
                type: "пополнение",
                status: "успешно",
            },
            {
                id: 2,
                date: "16.02.2026",
                amount: 14000,
                type: "пополнение",
                status: "успешно",
            },
        ]);
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
            console.log(topValue, bottomValue);
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
            <div className="flex justify-center items-center h-screen bg-[#031F23]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div>
            <UserLayout>
                <BackNav title="Журнал операций" />
                <div 
                    className="min-h-screen px-4 pb-10 bg-[#031F23] flex flex-col justify-between"
                    style={{ minHeight: `${screenHeight - (64 + safeAreaTop + safeAreaBottom)}px` }}
                >
                    <div className="flex-1">

                        <div className="text-white">
                            Здесь отображаются операции пополнения баланса приложения (предоплата за услуги), а также история покупок продуктов. Внесённые средства учитываются как внутренний баланс и могут быть использованы исключительно для оплаты услуг внутри приложения
                        </div>

                        <div className="text-white mt-3">
                            <div className="font-medium">Баланс приложения</div>
                            <div className="mt-2 border border-white/40 rounded-full py-2 px-2.5 flex items-center gap-x-6 max-w-max">
                                <div>{1000} руб.</div>
                                <div>
                                    <img src={needMoney} alt="wallet" className="w-6 h-6 object-cover" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 bg-[#114E50] rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-xl font-medium">История пополнений</div>
                                <button onClick={() => setIsHistoryOpen(!isHistoryOpen)}>
                                    <img src={arrowDown} alt="arrow-down" className={`w-6 h-6 object-cover ${isHistoryOpen ? "rotate-180" : ""}`} />
                                </button>
                            </div>
                            {isHistoryOpen && (
                                <div className="mt-2 space-y-3">
                                    {history && history.length > 0 && history.map((item) => (
                                        <div key={item.id} className="border border-white/10 rounded-xl py-2.5 px-3">
                                            <div className="text-white/60 text-xs">
                                                {item.date}, {item.id}
                                            </div>
                                            <div className="text-white">
                                                {item.amount.toLocaleString("ru-RU")} руб.
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-3 bg-[#114E50] rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-xl font-medium">История покупок</div>
                                <button onClick={() => setIsPurchasesOpen(!isPurchasesOpen)}>
                                    <img src={arrowDown} alt="arrow-down" className={`w-6 h-6 object-cover ${isHistoryOpen ? "rotate-180" : ""}`} />
                                </button>
                            </div>
                            {isPurchasesOpen && (
                                <div className="mt-2 space-y-3">
                                    {purchases && purchases.length > 0 && purchases.map((item) => (
                                        <div key={item.id} className="border border-white/10 rounded-xl py-2.5 px-3">
                                            <div className="text-white/60 text-xs">
                                                {item.date}, {item.amount.toLocaleString("ru-RU")} руб.
                                            </div>
                                            <div className="text-white">
                                                {item.product}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <Link 
                        to="/client/register"
                        className="w-full block mt-4 bg-white/10 text-[#FFFFFF] py-2.5 text-center font-medium rounded-full"
                    >
                        Пополнить баланс зарубежной картой 
                    </Link>
                    <div className="mt-3">
                        <MyLink to="/client/contactus" text="Пополнить баланс картой РФ" className='w-full' color='red'/>
                    </div>
                </div>
            </UserLayout>
        </div>
    );
};