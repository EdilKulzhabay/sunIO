import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import star from '../../assets/star.png';
import api from '../../api';

interface ClientInsufficientBonusModalProps {
    isOpen: boolean;
    onClose: () => void;
    starsRequired: number;
    userBonus: number;
    contentTitle: string;
}

export const BonusPolicyModal = ({ isOpen, onClose, pointsAwardingPolicy }: { isOpen: boolean; onClose: () => void; pointsAwardingPolicy?: any }) => {
    if (!isOpen) return null;

    const policies = pointsAwardingPolicy?.list || [
        { id: 1, title: 'Регистрация в приложении', content: '10 Солнц' },
        { id: 2, title: 'Приглашение друга по ссылке', content: '2 Солнца' },
        { id: 3, title: 'Заполнение дневника осознаний', content: '2 Солнца (1 Солнце за дневник, 1 Солнце за упражнение)' },
        { id: 4, title: 'Просмотр контента', content: 'Солнца за просмотр каждой единицы контента' },
        { id: 5, title: 'Участие в клубе Мастерская энергий', content: '10 солнц за каждый уровень активации' },
    ];

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            {/* Мобильная версия: модальное окно снизу */}
            <div className="flex items-end justify-center min-h-screen sm:hidden">
                {/* Overlay */}
                <div 
                    className="fixed inset-0 bg-black/60 transition-opacity z-20"
                    onClick={onClose}
                />

                {/* Modal - снизу на мобильных */}
                <div 
                    className="relative z-50 px-4 pt-6 pb-8 inline-block w-full bg-[#114E50] rounded-t-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-[26px] right-5 cursor-pointer z-10"
                    >
                        <X size={24} />
                    </button>
                    
                    <div className="">
                        <div className='flex items-center gap-x-3 mb-4'>
                            <h3 className="text-xl font-bold">{pointsAwardingPolicy?.title || 'Как это работает?'}</h3>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            {policies.map((policy: any) => (
                                <div key={policy.id} className="">
                                    <p className="text-white font-medium">{policy.title}</p>
                                    <p className='mt-1 text-sm'>{policy.content}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-gray-400 italic mb-6">
                            Возможность списания Солнц на продукты только для зарегистрированных пользователей.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-3 bg-[#C4841D] rounded-xl hover:bg-[#C4841D] transition-colors"
                        >
                            Понятно
                        </button>
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
                    className="relative p-8 inline-block align-middle bg-[#114E50] rounded-lg text-left text-white overflow-hidden shadow-xl transform transition-all max-h-[90vh] overflow-y-auto"
                    style={{ maxWidth: '600px', width: '100%' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 cursor-pointer z-10"
                    >
                        <X size={32} />
                    </button>
                    
                    <div className="mt-4">
                    <div className='flex items-center gap-x-3 mb-5'>
                            <img src={star} alt="star icon" className='w-6 h-6' />
                            <h3 className="text-2xl font-bold">{pointsAwardingPolicy?.title || 'Как это работает?'}</h3>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            {policies.map((policy: any) => (
                                <div key={policy.id} className="">
                                    <p className="text-white font-medium text-lg">{policy.title}</p>
                                    <p className='mt-1'>{policy.content}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-base text-gray-400 italic mb-6">
                            Возможность списания Солнц на продукты только для зарегистрированных пользователей.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full px-6 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Понятно
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ClientInsufficientBonusModal = ({ 
    isOpen, 
    onClose,
    starsRequired,
    userBonus,
    contentTitle,
}: ClientInsufficientBonusModalProps) => {
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [pointsAwardingPolicy, setPointsAwardingPolicy] = useState<any>(null);
    const fetchPointsAwardingPolicy = async () => {
        const response = await api.get('/api/points-awarding-policy');
        if (response.data.success) {
            setPointsAwardingPolicy(response.data.data[0]);
        }
    }

    useEffect(() => {
        fetchPointsAwardingPolicy();
    }, []);

    // Сбрасываем состояние второго модального окна при закрытии основного
    useEffect(() => {
        if (!isOpen) {
            setIsPolicyModalOpen(false);
        }
    }, [isOpen]);

    // Не возвращаем null, если хотя бы одно модальное окно открыто
    if (!isOpen && !isPolicyModalOpen) return null;

    const handleMoreInfoClick = () => {
        // Открываем второе модальное окно
        setIsPolicyModalOpen(true);
    };

    const handlePolicyModalClose = () => {
        // Закрываем второе модальное окно
        setIsPolicyModalOpen(false);
        // И закрываем первое модальное окно
        onClose();
    };

    return (
        <>
            <BonusPolicyModal isOpen={isPolicyModalOpen} onClose={handlePolicyModalClose} pointsAwardingPolicy={pointsAwardingPolicy || null} />
            {isOpen && !isPolicyModalOpen && (
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
                    className="relative z-50 px-4 pt-6 pb-8 inline-block w-full bg-[#114E50] rounded-t-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-[26px] right-5 cursor-pointer"
                    >
                        <X size={24} />
                    </button>
                    
                    <div className="">
                        <h3 className="text-xl font-bold mb-4">Недостаточно Солнц</h3>
                        <div className="mb-4">
                            <p className="mb-2">Вы хотите приобрести контент:</p>
                            <p className="mb-4">{contentTitle}</p>
                            <p className="font-semibold text-lg mb-2">Стоимость в Солнцах: {starsRequired}</p>
                            <p className="font-semibold text-lg mb-4">У вас есть Солнца: {userBonus}</p>
                        </div>
                        <p className="mb-4 text-gray-300">
                            Вы можете получить дополнительные Солнца, выполняя задания. Немного терпения.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleMoreInfoClick}
                                className="flex-1 px-4 py-3 bg-[#C4841D] rounded-lg hover:bg-[#C4841D] transition-colors"
                            >
                                Подробнее
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
                    className="relative p-8 inline-block align-middle bg-[#114E50] rounded-lg text-left text-white overflow-hidden shadow-xl transform transition-all"
                    style={{ maxWidth: '500px', width: '100%' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 cursor-pointer"
                    >
                        <X size={32} />
                    </button>
                    
                    <div className="">
                        <h3 className="text-2xl font-bold mb-4">Недостаточно Солнц</h3>
                        <div className="mb-6">
                            <p className="mb-2">Вы хотите приобрести контент:</p>
                            <p className="mb-4">{contentTitle}</p>
                            <p className="font-semibold text-lg mb-2">Стоимость Солнц: {starsRequired}</p>
                            <p className="font-semibold text-lg mb-4">У вас есть Солнца: {userBonus}</p>
                        </div>
                        <p className="mb-6 text-gray-300">
                            Вы можете получить дополнительные Солнца, выполняя задания. Немного терпения.
                        </p>
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleMoreInfoClick}
                                className="flex-1 px-6 py-3 bg-[#C4841D] rounded-lg hover:bg-[#C4841D] transition-colors"
                            >
                                Подробнее
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
            )}
        </>
    );
};

