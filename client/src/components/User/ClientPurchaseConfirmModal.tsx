import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api';

interface ClientPurchaseConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    contentId: string;
    contentType: 'practice' | 'meditation' | 'video-lesson';
    contentTitle: string;
    starsRequired: number;
    userBonus: number;
    onPurchaseSuccess: () => void;
}

export const ClientPurchaseConfirmModal = ({ 
    isOpen, 
    onClose,
    contentId,
    contentType,
    contentTitle,
    starsRequired,
    userBonus,
    onPurchaseSuccess,
}: ClientPurchaseConfirmModalProps) => {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handlePurchase = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user._id;
            setLoading(true);
            const response = await api.post('/api/user/purchase-content', {
                userId,
                contentId,
                contentType,
            });

            if (response.data.success) {
                toast.success('Контент успешно приобретен!');
                onPurchaseSuccess();
                onClose();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка при покупке контента');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Мобильная версия: модальное окно снизу */}
            <div className="flex items-end justify-center min-h-screen sm:hidden">
                {/* Overlay */}
                <div 
                    className="fixed inset-0 bg-black/60 transition-opacity z-20"
                    onClick={onClose}
                />

                {/* Modal - снизу на мобильных */}
                <div 
                    className="relative z-50 px-4 pt-6 pb-8 inline-block w-full bg-[#333333] rounded-t-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-5 cursor-pointer"
                        disabled={loading}
                    >
                        <X size={24} />
                    </button>
                    
                    <div className="">
                        <h3 className="text-xl font-bold mb-4">Подтверждение покупки</h3>
                        <p className="mb-2">Вы хотите приобрести контент:</p>
                        <p className="font-semibold mb-4">{contentTitle}</p>
                        <div className="mb-4">
                            <p className="mb-1">Стоимость звёзд: <span className="font-bold">{starsRequired}</span></p>
                            <p className="mb-1">У вас есть звёзд: <span className="font-bold">{userBonus}</span></p>
                            <p className="text-sm text-gray-300">После покупки у вас останется звёзд: <span className="font-bold">{userBonus - starsRequired}</span></p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handlePurchase}
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Покупка...' : 'Купить'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Десктопная версия: модальное окно по центру */}
            <div className="hidden sm:flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                {/* Overlay */}
                <div 
                    className="fixed inset-0 bg-black/60 transition-opacity"
                    onClick={onClose}
                />

                {/* Modal - по центру на десктопе */}
                <div 
                    className="relative p-8 inline-block align-middle bg-[#333333] rounded-lg text-left text-white overflow-hidden shadow-xl transform transition-all"
                    style={{ maxWidth: '500px', width: '100%' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 cursor-pointer"
                        disabled={loading}
                    >
                        <X size={32} />
                    </button>
                    
                    <div className="">
                        <h3 className="text-2xl font-bold mb-4">Подтверждение покупки</h3>
                        <p className="mb-2">Вы хотите приобрести контент:</p>
                        <p className="font-semibold mb-4 text-lg">{contentTitle}</p>
                        <div className="mb-6">
                            <p className="mb-2">Стоимость звёзд: <span className="font-bold text-xl">{starsRequired}</span></p>
                            <p className="mb-2">У вас есть звёзд: <span className="font-bold text-xl">{userBonus}</span></p>
                            <p className="text-sm text-gray-300">После покупки у вас останется звёзд: <span className="font-bold">{userBonus - starsRequired}</span></p>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handlePurchase}
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Покупка...' : 'Купить'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

