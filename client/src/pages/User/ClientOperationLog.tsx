import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import needMoney from "../../assets/needMoney.png";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import whiteArrowRight from "../../assets/whiteArrowRight.png";
import { openExternalLink } from "../../utils/telegramWebApp";
import { Switch } from "../../components/User/Switch";
import supportKarmaIcon from "../../assets/supportKarma.png";
import { IOS_PWA_TOP_INSET_PX } from "../../components/UserIosPwaTopInset";
import { isIosPwaStandalone } from "../../utils/pwaEnv";

export const ClientOperationLog = () => {
    const navigate = useNavigate();
    const [screenHeight, setScreenHeight] = useState(0);
    const [safeAreaTop, setSafeAreaTop] = useState(0);
    const [safeAreaBottom, setSafeAreaBottom] = useState(0);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [supportKarma, setSupportKarma] = useState(0);

    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [depositLoading, setDepositLoading] = useState(false);

    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [supportAmount, setSupportAmount] = useState('');
    const [supportLoading, setSupportLoading] = useState(false);

    const [isDocumentsAccepted, setIsDocumentsAccepted] = useState(false);

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
                setSupportKarma(response.data.data.supportKarma || 0);
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
                openExternalLink(response.data.url, { preferCurrentWindow: true });
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
            const height = Math.round(window.visualViewport?.height || window.innerHeight);
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
        window.visualViewport?.addEventListener('resize', updateScreenHeight);
        window.visualViewport?.addEventListener('scroll', updateScreenHeight);
        return () => {
            window.removeEventListener('resize', updateScreenHeight);
            window.visualViewport?.removeEventListener('resize', updateScreenHeight);
            window.visualViewport?.removeEventListener('scroll', updateScreenHeight);
        };
    }, []);


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
                <BackNav title="Журнал операций" />
                <div 
                    className="min-h-screen px-4 pb-4 bg-[#031F23] flex flex-col justify-between"
                    style={{
                        minHeight: `${screenHeight - (64 + safeAreaTop + safeAreaBottom + (isIosPwaStandalone() ? IOS_PWA_TOP_INSET_PX + 20 : 0))}px`,
                    }}
                >
                    <div className="flex-1">
                        <div className="bg-[#114E50] rounded-xl p-4 text-white flex items-start gap-x-3 w-full">
                            <div className="shrink-0">
                                <img src={needMoney} alt="wallet" className="w-[30px] h-[30px] object-cover" />
                            </div>
                            <div className="w-full">
                                <div className="w-full flex items-center justify-between text-xl font-medium">
                                    <div>Баланс приложения</div>
                                    <div>{balance.toLocaleString("ru-RU")} ₽</div>
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
                        <div className="mt-3 bg-[#114E50] rounded-xl p-4 text-white flex items-start gap-x-3 w-full">
                            <div className="shrink-0">
                                <img src={supportKarmaIcon} alt="supportKarmaIcon" className="w-[30px] h-[30px] object-cover" />
                            </div>
                            <div className="w-full">
                                <div className="w-full flex items-center justify-between text-xl font-medium">
                                    <div>Поддержка проекта</div>
                                    <div>{supportKarma.toLocaleString("ru-RU")} ₽</div>
                                </div>
                                <div>
                                    Здесь отображается сумма, которую вы внесли в поддержку проекта
                                </div>

                                <button
                                    onClick={() => { setIsSupportModalOpen(true); setSupportAmount(''); }}
                                    className="w-full block mt-3 bg-white/10 text-white py-2.5 text-center text-sm rounded-full hover:cursor-pointer"
                                >
                                    Поддержать проект
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="flex items-center justify-between">
                            <div>Принимаю условие Документов</div>
                            <Switch checked={isDocumentsAccepted} onChange={() => {setIsDocumentsAccepted(!isDocumentsAccepted);}} />
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsDepositModalOpen(true)}
                            disabled={!isDocumentsAccepted}
                            className="mt-3 w-full block bg-[#C4841D] text-white py-2.5 text-center font-medium rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Пополнить баланс картой
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
                                    <label className="text-sm text-white/60 mb-1 block">Сумма пополнения от 100 руб.</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        placeholder="Введите сумму"
                                        min="1"
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#C4841D]"
                                    />
                                </div>
                                <button
                                    type="button"
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
                                    <label className="text-sm text-white/60 mb-1 block">Сумма пополнения от 100 руб.</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        placeholder="Введите сумму"
                                        min="1"
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#C4841D]"
                                    />
                                </div>
                                <button
                                    type="button"
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

                {/* Модалка поддержки проекта */}
                {isSupportModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-end justify-center min-h-screen sm:hidden">
                            <div
                                className="fixed inset-0 bg-black/60 transition-opacity z-20"
                                onClick={() => { setIsSupportModalOpen(false); setSupportAmount(''); }}
                            />
                            <div
                                className="relative z-50 px-4 pt-6 pb-8 inline-block w-full bg-[#114E50] rounded-t-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => { setIsSupportModalOpen(false); setSupportAmount(''); }}
                                    className="absolute top-[26px] right-5 cursor-pointer"
                                >
                                    <X size={24} />
                                </button>
                                <div className="text-xl font-semibold mb-4">Поддержка проекта</div>
                                <div className="mb-3">
                                    <label className="text-sm text-white/60 mb-1 block">Эта сумма будет направлена на развитие Приложения</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={supportAmount}
                                        onChange={(e) => setSupportAmount(e.target.value)}
                                        placeholder="Введите сумму для списания с баланса"
                                        min="1"
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#C4841D]"
                                    />
                                </div>
                                <button
                                    onClick={async () => {
                                        const amount = parseFloat(supportAmount);
                                        if (!amount || amount <= 0) {
                                            toast.warning('Введите корректную сумму');
                                            return;
                                        }
                                        if (amount > balance) {
                                            toast.warning('Недостаточно средств на балансе');
                                            return;
                                        }
                                        setSupportLoading(true);
                                        try {
                                            const user = JSON.parse(localStorage.getItem('user') || '{}');
                                            const response = await api.post('/api/user/support-project', {
                                                userId: user._id,
                                                amount,
                                            });
                                            if (response.data.success) {
                                                const updated = response.data.user || {};
                                                setBalance(updated.balance ?? balance - amount);
                                                setSupportKarma(updated.supportKarma ?? supportKarma + amount);
                                                toast.success('Спасибо за поддержку проекта!');
                                                setIsSupportModalOpen(false);
                                                setSupportAmount('');
                                            } else {
                                                toast.error(response.data.message || 'Ошибка при поддержке проекта');
                                            }
                                        } catch (error: any) {
                                            toast.error(error.response?.data?.message || 'Ошибка при поддержке проекта');
                                        } finally {
                                            setSupportLoading(false);
                                        }
                                    }}
                                    disabled={supportLoading || !supportAmount || parseFloat(supportAmount) <= 0}
                                    className="w-full py-3 bg-[#C4841D] text-white font-medium rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {supportLoading ? 'Обработка...' : 'Поддержать проект'}
                                </button>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                            <div
                                className="fixed inset-0 bg-black/60 transition-opacity"
                                onClick={() => { setIsSupportModalOpen(false); setSupportAmount(''); }}
                            />
                            <div
                                className="relative p-8 inline-block align-middle bg-[#114E50] rounded-lg text-left text-white overflow-hidden shadow-xl transform transition-all"
                                style={{ maxWidth: '500px', width: '100%' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => { setIsSupportModalOpen(false); setSupportAmount(''); }}
                                    className="absolute top-8 right-8 cursor-pointer"
                                >
                                    <X size={32} />
                                </button>
                                <div className="text-xl font-semibold mb-4">Поддержка проекта</div>
                                <div className="mb-4">
                                    <label className="text-sm text-white/60 mb-1 block">Эта сумма будет направлена на развитие Приложения</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={supportAmount}
                                        onChange={(e) => setSupportAmount(e.target.value)}
                                        placeholder="Введите сумму для списания с баланса"
                                        min="1"
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#C4841D]"
                                    />
                                </div>
                                <button
                                    onClick={async () => {
                                        const amount = parseFloat(supportAmount);
                                        if (!amount || amount <= 0) {
                                            toast.warning('Введите корректную сумму');
                                            return;
                                        }
                                        if (amount > balance) {
                                            toast.warning('Недостаточно средств на балансе');
                                            return;
                                        }
                                        setSupportLoading(true);
                                        try {
                                            const user = JSON.parse(localStorage.getItem('user') || '{}');
                                            const response = await api.post('/api/user/support-project', {
                                                userId: user._id,
                                                amount,
                                            });
                                            if (response.data.success) {
                                                const updated = response.data.user || {};
                                                setBalance(updated.balance ?? balance - amount);
                                                setSupportKarma(updated.supportKarma ?? supportKarma + amount);
                                                toast.success('Спасибо за поддержку проекта!');
                                                setIsSupportModalOpen(false);
                                                setSupportAmount('');
                                            } else {
                                                toast.error(response.data.message || 'Ошибка при поддержке проекта');
                                            }
                                        } catch (error: any) {
                                            toast.error(error.response?.data?.message || 'Ошибка при поддержке проекта');
                                        } finally {
                                            setSupportLoading(false);
                                        }
                                    }}
                                    disabled={supportLoading || !supportAmount || parseFloat(supportAmount) <= 0}
                                    className="w-full py-3 bg-[#C4841D] text-white font-medium rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {supportLoading ? 'Обработка...' : 'Поддержать проект'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </UserLayout>
        </div>
    );
};