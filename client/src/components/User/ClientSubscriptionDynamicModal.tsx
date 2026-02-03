import { X } from 'lucide-react';
import { MyLink } from './MyLink';

interface ClientSubscriptionDynamicModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    accessType: string;
}

export const ClientSubscriptionDynamicModal = ({ 
    isOpen, 
    onClose,
    content,
    accessType,
}: ClientSubscriptionDynamicModalProps) => {
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
                    className="relative z-50 px-4 pt-6 pb-8 inline-block w-full bg-[#333333] rounded-t-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-5 cursor-pointer"
                    >
                        <X size={24} />
                    </button>
                    <div 
                        className="[&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_div]:mb-2 [&_span]:font-bold" 
                        dangerouslySetInnerHTML={{ __html: content }} 
                    />
                    {accessType === "subscription" && (
                        <MyLink to="/about" text="Вступить в клуб" className='w-full mt-4 text-lg' color='red'/>
                    )}
                    {accessType === "stars" && (
                        <MyLink to="/client/register" text="Зарегистрироваться" className='w-full mt-4 text-lg' color='red'/>
                    )}
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
                    style={{ maxWidth: '700px', width: '100%' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 cursor-pointer"
                    >
                        <X size={32} />
                    </button>
                    <div 
                        className="mt-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_div]:mb-2 [&_span]:font-bold" 
                        dangerouslySetInnerHTML={{ __html: content }} 
                    />
                    {accessType === "subscription" && (
                        <MyLink to="/about" text="Вступить в клуб" className='w-full mt-4 text-lg' color='red'/>
                    )}
                    {accessType === "stars" && (
                        <MyLink to="/client/register" text="Зарегистрироваться" className='w-full mt-4 text-lg' color='red'/>
                    )}
                </div>
            </div>
        </div>
    );
};

