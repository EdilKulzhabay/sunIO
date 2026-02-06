import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import star from '../../assets/star.png';

interface ClientInsufficientBonusModalProps {
    isOpen: boolean;
    onClose: () => void;
    starsRequired: number;
    userBonus: number;
    contentTitle: string;
}

export const BonusPolicyModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;

    const policies = [
        { id: 1, title: 'Регистрация в приложении', subtitle: '10 звёзд' },
        { id: 2, title: 'Приглашение участника по ссылке', subtitle: '2 звёзды' },
        { id: 3, title: 'Заполнение дневника', subtitle: '2 звёзды (1 звёзда за дневник, 1 звёзда за упражнение)' },
        { id: 4, title: 'Просмотр бесплатного контента', subtitle: '1 звёзда за просмотр каждой единицы контента' },
        { id: 5, title: 'Регистрация в клубе .li', subtitle: '10 звёзд' },
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
                        className="absolute top-6 right-5 cursor-pointer z-10"
                    >
                        <X size={24} />
                    </button>
                    
                    <div className="">
                        <div className='flex items-center gap-x-3 mb-4'>
                            <h3 className="text-xl font-bold">Как это работает?</h3>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            {policies.map((policy) => (
                                <div key={policy.id} className="">
                                    <p className="text-white font-medium">{policy.title}</p>
                                    <p className='mt-1 text-sm'>{policy.subtitle}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-gray-400 italic mb-6">
                            Возможность списания звёзд на продукты только для зарегистрированных пользователей.
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
                            <h3 className="text-2xl font-bold">Как это работает?</h3>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            {policies.map((policy) => (
                                <div key={policy.id} className="">
                                    <p className="text-white font-medium text-lg">{policy.title}</p>
                                    <p className='mt-1'>{policy.subtitle}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-base text-gray-400 italic mb-6">
                            Возможность списания звёзд на продукты только для зарегистрированных пользователей.
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
            <BonusPolicyModal isOpen={isPolicyModalOpen} onClose={handlePolicyModalClose} />
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
                        className="absolute top-6 right-5 cursor-pointer"
                    >
                        <X size={24} />
                    </button>
                    
                    <div className="">
                        <h3 className="text-xl font-bold mb-4">Недостаточно звёзд</h3>
                        <div className="mb-4">
                            <p className="mb-2">Вы хотите приобрести контент:</p>
                            <p className="mb-4">{contentTitle}</p>
                            <p className="font-semibold text-lg mb-2">Стоимость в звёздах: {starsRequired}</p>
                            <p className="font-semibold text-lg mb-4">У вас есть звёзд: {userBonus}</p>
                        </div>
                        <p className="mb-4 text-gray-300">
                            Вы можете получить дополнительные звёзды, выполняя задания. Немного терпения.
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
                                className="flex-1 px-4 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
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
                        <h3 className="text-2xl font-bold mb-4">Недостаточно звёзд</h3>
                        <div className="mb-6">
                            <p className="mb-2">Вы хотите приобрести контент:</p>
                            <p className="mb-4">{contentTitle}</p>
                            <p className="font-semibold text-lg mb-2">Стоимость звёзд: {starsRequired}</p>
                            <p className="font-semibold text-lg mb-4">У вас есть звёзд: {userBonus}</p>
                        </div>
                        <p className="mb-6 text-gray-300">
                            Вы можете получить дополнительные звёзды, выполняя задания. Немного терпения.
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
                                className="flex-1 px-6 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
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

