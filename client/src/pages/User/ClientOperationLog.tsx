import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import needMoney from "../../assets/needMoney.png";
import arrowDown from "../../assets/arrowDown.png";
import { toast } from "react-toastify";
import { X } from "lucide-react";

export const ClientOperationLog = () => {
    const navigate = useNavigate();
    const [screenHeight, setScreenHeight] = useState(0);
    const [safeAreaTop, setSafeAreaTop] = useState(0);
    const [safeAreaBottom, setSafeAreaBottom] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isPurchasesOpen, setIsPurchasesOpen] = useState(false);
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState<any[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);

    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [depositLoading, setDepositLoading] = useState(false);

    useEffect(() => {
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

        fetchOperationHistory();
    }, [navigate]);

    const fetchOperationHistory = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user._id) return;
            const response = await api.get(`/api/operation-history/${user._id}`);
            if (response.data.success) {
                setBalance(response.data.data.balance || 0);
                setHistory(response.data.data.depositHistory || []);
                setPurchases(response.data.data.purchaseHistory || []);
            }
        } catch (error) {
            console.error('Ошибка загрузки истории операций:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount);
        if (!amount || amount <= 0) {
            toast.warning('Введите корректную сумму');
            return;
        }
        setDepositLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await api.post('/api/deposit/create', { userId: user._id, amount });
            if (response.data.success && response.data.url) {
                setIsDepositModalOpen(false);
                setDepositAmount('');
                const tg = (window as any).Telegram?.WebApp;
                if (tg?.openLink) {
                    tg.openLink(response.data.url, { try_instant_view: false });
                } else {
                    window.location.href = response.data.url;
                }
            } else {
                toast.error(response.data.message || 'Ошибка создания платежа');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка создания платежа');
        } finally {
            setDepositLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'paid': return 'Успешно';
            case 'pending': return 'В обработке';
            case 'failed': return 'Ошибка';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'text-green-400';
            case 'pending': return 'text-yellow-400';
            case 'failed': return 'text-red-400';
            default: return 'text-white/60';
        }
    };

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
                                <div>{balance.toLocaleString("ru-RU")} руб.</div>
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
                                    {history.length > 0 ? history.map((item) => (
                                        <div key={item._id} className="border border-white/10 rounded-xl py-2.5 px-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-white/60 text-xs">
                                                    {formatDate(item.date)}
                                                </div>
                                                <div className={`text-xs ${getStatusColor(item.status)}`}>
                                                    {getStatusLabel(item.status)}
                                                </div>
                                            </div>
                                            <div className="text-white mt-1">
                                                +{item.amount.toLocaleString("ru-RU")} руб.
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-white/40 text-sm">Нет операций</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-3 bg-[#114E50] rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-xl font-medium">История покупок</div>
                                <button onClick={() => setIsPurchasesOpen(!isPurchasesOpen)}>
                                    <img src={arrowDown} alt="arrow-down" className={`w-6 h-6 object-cover ${isPurchasesOpen ? "rotate-180" : ""}`} />
                                </button>
                            </div>
                            {isPurchasesOpen && (
                                <div className="mt-2 space-y-3">
                                    {purchases.length > 0 ? purchases.map((item) => (
                                        <div key={item._id} className="border border-white/10 rounded-xl py-2.5 px-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-white/60 text-xs">
                                                    {formatDate(item.date)}, {item.amount.toLocaleString("ru-RU")} руб.
                                                </div>
                                                <div className={`text-xs ${getStatusColor(item.status)}`}>
                                                    {getStatusLabel(item.status)}
                                                </div>
                                            </div>
                                            <div className="text-white mt-1">
                                                {item.product}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-white/40 text-sm">Нет покупок</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsDepositModalOpen(true)}
                        className="w-full block mt-4 bg-white/10 text-[#FFFFFF] py-2.5 text-center font-medium rounded-full"
                    >
                        Пополнить баланс зарубежной картой
                    </button>
                    <div className="mt-3">
                        <button
                            onClick={() => setIsDepositModalOpen(true)}
                            className="w-full block bg-[#C4841D] text-white py-2.5 text-center font-medium rounded-full"
                        >
                            Пополнить баланс картой РФ
                        </button>
                    </div>
                </div>

                {/* Модалка пополнения */}
                {isDepositModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-end justify-center min-h-screen sm:hidden">
                            <div
                                className="fixed inset-0 bg-black/60 transition-opacity z-20"
                                onClick={() => { setIsDepositModalOpen(false); setDepositAmount(''); }}
                            />
                            <div
                                className="relative z-50 px-4 pt-6 pb-8 inline-block w-full bg-[#114E50] rounded-t-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => { setIsDepositModalOpen(false); setDepositAmount(''); }}
                                    className="absolute top-[26px] right-5 cursor-pointer"
                                >
                                    <X size={24} />
                                </button>
                                <div className="text-xl font-semibold mb-4">Пополнение баланса</div>
                                <div className="mb-3">
                                    <label className="text-sm text-white/60 mb-1 block">Сумма пополнения (руб.)</label>
                                    <input
                                        type="number"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        placeholder="Введите сумму"
                                        min="1"
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#C4841D]"
                                    />
                                </div>
                                <button
                                    onClick={handleDeposit}
                                    disabled={depositLoading || !depositAmount || parseFloat(depositAmount) <= 0}
                                    className="w-full py-3 bg-[#C4841D] text-white font-medium rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {depositLoading ? 'Загрузка...' : 'Перейти к оплате'}
                                </button>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                            <div
                                className="fixed inset-0 bg-black/60 transition-opacity"
                                onClick={() => { setIsDepositModalOpen(false); setDepositAmount(''); }}
                            />
                            <div
                                className="relative p-8 inline-block align-middle bg-[#114E50] rounded-lg text-left text-white overflow-hidden shadow-xl transform transition-all"
                                style={{ maxWidth: '500px', width: '100%' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => { setIsDepositModalOpen(false); setDepositAmount(''); }}
                                    className="absolute top-8 right-8 cursor-pointer"
                                >
                                    <X size={32} />
                                </button>
                                <div className="text-xl font-semibold mb-4">Пополнение баланса</div>
                                <div className="mb-4">
                                    <label className="text-sm text-white/60 mb-1 block">Сумма пополнения (руб.)</label>
                                    <input
                                        type="number"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        placeholder="Введите сумму"
                                        min="1"
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#C4841D]"
                                    />
                                </div>
                                <button
                                    onClick={handleDeposit}
                                    disabled={depositLoading || !depositAmount || parseFloat(depositAmount) <= 0}
                                    className="w-full py-3 bg-[#C4841D] text-white font-medium rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {depositLoading ? 'Загрузка...' : 'Перейти к оплате'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </UserLayout>
        </div>
    );
};