import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import needMoney from "../../assets/needMoney.png";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import whiteArrowRight from "../../assets/whiteArrowRight.png";

export const ClientOperationLog = () => {
    const navigate = useNavigate();
    const [screenHeight, setScreenHeight] = useState(0);
    const [safeAreaTop, setSafeAreaTop] = useState(0);
    const [safeAreaBottom, setSafeAreaBottom] = useState(0);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);

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
            const response = await api.get(`/api/operation-logs/client/${user._id}`);
            if (response.data.success) {
                setBalance(response.data.data.balance || 0);
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
                        <div className="bg-[#114E50] rounded-xl p-4 text-white flex items-start gap-x-3">
                            <div className="shrink-0">
                                <img src={needMoney} alt="wallet" className="w-[30px] h-[30px] object-cover" />
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-xl font-medium">
                                    <div>Баланс приложения</div>
                                    <div>{balance.toLocaleString("ru-RU")} руб.</div>
                                </div>
                                <div>
                                Внесённые на баланс средства могут быть использованы только для оплаты продуктов внутри Приложения Солнце
                                </div>
                            </div>
                        </div>

                        <button onClick={() => {navigate('/client/deposit-log')}} className="w-full block mt-3 bg-[#114E50] rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-xl font-medium">История пополнений</div>
                                <div>
                                <img src={whiteArrowRight} alt="arrow-right" className="w-4 h-4 object-cover" />
                                </div>
                            </div>
                        </button>

                        <button onClick={() => {navigate('/client/purchase-log')}} className="w-full block mt-3 bg-[#114E50] rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-xl font-medium">История покупок</div>
                                <div>
                                    <img src={whiteArrowRight} alt="arrow-right" className="w-4 h-4 object-cover" />
                                </div>
                            </div>
                        </button>
                        <button onClick={() => navigate('/client/documents')} className="w-full block mt-3 bg-[#114E50] rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-xl font-medium">Документы</div>
                                <div>
                                    <img src={whiteArrowRight} alt="arrow-right" className="w-4 h-4 object-cover" />
                                </div>
                            </div>
                        </button>
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