import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api';
import { RedButton } from './RedButton';

interface ClientPaidDynamicModalProps {
    isOpen: boolean;
    onClose: () => void;
    content?: string;
    accessType?: string;
    /** Контент для покупки (при accessType paid) */
    item?: {
        _id: string;
        title: string;
        shortDescription?: string;
        price?: number;
    };
    contentType?: string;
    userBalance?: number;
    onPurchaseSuccess?: () => void;
}

export const ClientPaidDynamicModal = ({
    isOpen,
    onClose,
    item,
    contentType,
    userBalance = 0,
    onPurchaseSuccess,
}: ClientPaidDynamicModalProps) => {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const price = item?.price ?? 0;
    const canBuy = price > 0 && userBalance >= price;

    const handlePurchase = async () => {
        if (!item || !contentType || !canBuy) return;
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user._id) {
                toast.error('Необходимо войти в аккаунт');
                return;
            }
            setLoading(true);
            const response = await api.post('/api/user/purchase-content', {
                userId: user._id,
                contentId: item._id,
                contentType,
            });

            if (response.data.success) {
                toast.success('Контент успешно приобретен!');
                if (response.data.user) {
                    localStorage.setItem('user', JSON.stringify({ ...user, ...response.data.user }));
                }
                onPurchaseSuccess?.();
                onClose();
            } else {
                toast.error(response.data.message || 'Ошибка при покупке');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка при покупке контента');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen sm:hidden">
                <div
                    className="fixed inset-0 bg-black/60 transition-opacity z-20"
                    onClick={onClose}
                />
                <div
                    className="relative z-50 px-4 pt-6 pb-8 inline-block w-full bg-[#114E50] rounded-t-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-[26px] right-5 cursor-pointer"
                    >
                        <X size={24} />
                    </button>
                    <div className="text-xl font-semibold mb-2">Покупка контента</div>
                    {item && (
                        <div className="text-white mt-2 space-y-3">
                            <p className="font-medium">{item.title}</p>
                            <p className="text-white/80 text-sm">{item.shortDescription}</p>
                            <p>Стоимость: <span className="font-bold">{price.toLocaleString('ru-RU')} руб.</span></p>
                            <p className="text-white/80 text-sm">Ваш баланс: {userBalance.toLocaleString('ru-RU')} руб.</p>
                            {canBuy ? (
                                <div className="flex flex-col gap-2 mt-4">
                                    <button
                                        onClick={handlePurchase}
                                        disabled={loading}
                                        className="w-full py-3 bg-[#C4841D] text-white font-medium rounded-full disabled:opacity-50"
                                    >
                                        {loading ? 'Покупка...' : `Купить за ${price.toLocaleString('ru-RU')} руб.`}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 mt-4">
                                    <p className="text-[#00C5AE] text-sm">Недостаточно средств. Пополните баланс для покупки.</p>
                                    <Link
                                        to="/client/operation-log"
                                        className="w-full py-3 bg-[#C4841D] text-white font-medium rounded-full text-center block"
                                    >
                                        Пополнить баланс
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                    {!item && (
                        <div className="text-white mt-2">
                            <RedButton text="Понятно" onClick={onClose} className="w-full mt-3" />
                        </div>
                    )}
                </div>
            </div>

            <div className="hidden sm:flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                <div
                    className="fixed inset-0 bg-black/60 transition-opacity"
                    onClick={onClose}
                />
                <div
                    className="relative p-8 inline-block align-middle bg-[#114E50] rounded-lg text-left text-white overflow-hidden shadow-xl transform transition-all"
                    style={{ maxWidth: '700px', width: '100%' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 cursor-pointer"
                    >
                        <X size={32} />
                    </button>
                    <div className="text-xl font-semibold mb-2">Покупка контента</div>
                    {item && (
                        <div className="text-white mt-2 space-y-3">
                            <p className="font-medium text-lg">{item.title}</p>
                            <p className="text-white/80 text-sm">{item.shortDescription}</p>
                            <p>Стоимость: <span className="font-bold">{price.toLocaleString('ru-RU')} руб.</span></p>
                            <p className="text-white/80 text-sm">Ваш баланс: {userBalance.toLocaleString('ru-RU')} руб.</p>
                            {canBuy ? (
                                <div className="flex flex-col gap-2 mt-6">
                                    <button
                                        onClick={handlePurchase}
                                        disabled={loading}
                                        className="w-full py-3 bg-[#C4841D] text-white font-medium rounded-full disabled:opacity-50"
                                    >
                                        {loading ? 'Покупка...' : `Купить за ${price.toLocaleString('ru-RU')} руб.`}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 mt-6">
                                    <p className="text-[#00C5AE] text-sm">Недостаточно средств. Пополните баланс для покупки.</p>
                                    <Link
                                        to="/client/operation-log"
                                        className="w-full py-3 bg-[#C4841D] text-white font-medium rounded-full text-center block"
                                    >
                                        Пополнить баланс
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                    {!item && (
                        <div className="text-white mt-2">
                            <RedButton text="Понятно" onClick={onClose} className="w-full mt-3" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
