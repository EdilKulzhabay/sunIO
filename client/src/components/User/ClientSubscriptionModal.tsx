import { X } from 'lucide-react';
import { MyLink } from './MyLink';

interface ClientSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ClientSubscriptionModal = ({ 
    isOpen, 
    onClose, 
}: ClientSubscriptionModalProps) => {
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
                    <h1 className="text-2xl font-medium">Что входит в подписку</h1>
                    <div className="mt-4">
                        <h2 className="font-medium">Эксклюзивный контент от Нурлана Мураткали</h2>
                        <p className="text-sm mt-1">
                            Вы можете получить доступ к всем медитациям в нашем клубе на 30 дней.
                        </p>
                    </div>
                    <div className="mt-3">
                        <h2 className="font-medium">Ежемесячные занятия по установке Пространства Защиты</h2>
                        <p className="text-sm mt-1">
                            Раз в месяц — прямой эфир 1.5–2 часа для защиты себя, близких, дома и бизнеса.
                        </p>
                    </div>
                    <div className="mt-3">
                        <h2 className="font-medium">Регулярная работа с энергетическими сущностями</h2>
                        <p className="text-sm mt-1">
                            Защитник Пространства, Проводник Целей, Хранитель Равновесия, Хранитель Клуба, Союзник, Энергетический Двойник и прочие.
                        </p>
                    </div>
                    <div className="mt-3">
                        <h2 className="font-medium">Сообщество единомышленников</h2>
                        <p className="text-sm mt-1">
                            Чат-группа для общения с другими участниками клуба.
                        </p>
                    </div>
                    <MyLink to="/about" text="Вступить в клуб" className='w-full mt-4' color='red'/>
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
                    <h1 className="text-[24px] font-medium">Что входит в подписку</h1>
                    <div className="mt-4">
                        <h2 className="text-lg font-medium">Эксклюзивный контент от Нурлана Мураткали</h2>
                        <p className="mt-1">
                            Вы можете получить доступ к всем медитациям в нашем клубе на 30 дней.
                        </p>
                    </div>
                    <div className="mt-3">
                        <h2 className="text-lg font-medium">Ежемесячные занятия по установке Пространства Защиты</h2>
                        <p className="mt-1">
                            Раз в месяц — прямой эфир 1.5–2 часа для защиты себя, близких, дома и бизнеса.
                        </p>
                    </div>
                    <div className="mt-3">
                        <h2 className="text-lg font-medium">Регулярная работа с энергетическими сущностями</h2>
                        <p className="mt-1">
                            Защитник Пространства, Проводник Целей, Хранитель Равновесия, Хранитель Клуба, Союзник, Энергетический Двойник и прочие.
                        </p>
                    </div>
                    <div className="mt-3">
                        <h2 className="text-lg font-medium">Сообщество единомышленников</h2>
                        <p className="mt-1">
                            Чат-группа для общения с другими участниками клуба.
                        </p>
                    </div>
                    <MyLink to="/about" text="Вступить в клуб" className='w-full mt-4 text-lg' color='red'/>
                </div>
            </div>
        </div>
    );
};

