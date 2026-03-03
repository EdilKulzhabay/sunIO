import { X } from 'lucide-react';
import { RedButton } from './RedButton';

interface ClientPaidDynamicModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    accessType: string;
}

export const ClientPaidDynamicModal = ({ 
    isOpen, 
    onClose,
}: ClientPaidDynamicModalProps) => {
    if (!isOpen) return null;

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
                    className="relative z-50 px-4 pt-6 pb-8 inline-block w-full bg-[#114E50] rounded-t-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-[26px] right-5 cursor-pointer"
                    >
                        <X size={24} />
                    </button>
                    <div className="text-xl font-semibold mb-2">
                        Платный контент
                    </div>
                    <div className="text-white mt-2">
                        <p>Функционал доступа к платному контенту внутри Приложения будет скоро доступен</p>
                    </div>
                    <RedButton text="Понятно" onClick={onClose} className="w-full mt-3" />
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
                    style={{ maxWidth: '700px', width: '100%' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 cursor-pointer"
                    >
                        <X size={32} />
                    </button>
                    <div className="text-xl font-semibold mb-2">
                        Платный контент
                    </div>
                    <div className="text-white mt-2">
                        <p>Функционал доступа к платному контенту внутри Приложения будет скоро доступен</p>
                    </div>
                    <RedButton text="Понятно" onClick={onClose} className="w-full mt-3" />
                </div>
            </div>
        </div>
    );
};

