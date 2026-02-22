import { useEffect, useRef, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

export interface InstructionStep {
    title: string;
    description: string;
    targetId: string;
}

const INSTRUCTION_STEPS: InstructionStep[] = [
    { title: 'Профиль пользователя', description: 'Настройки Приложения, внутренний баланс, пригласительная ссылка, ссылки на ресурсы', targetId: 'main-instruction-profile' },
    { title: 'Часто задаваемые вопросы', description: 'Ответы на частые вопросы, инструкция по работе с Приложением и контакты для связи', targetId: 'main-instruction-faq' },
    { title: 'Сообщество', description: 'Сообщество — это поддерживающее пространство для своих людей, кто уже прошёл Активацию', targetId: 'main-instruction-community' },
    { title: 'Навигатор', description: 'Переключение между пространствами пробуждения сознания через разные темы', targetId: 'main-instruction-navigator' },
    { title: 'Задания', description: 'Последовательность заданий в зависимости от вашего запроса, помогает всё делать последовательно', targetId: 'main-instruction-tasks' },
    { title: 'Дневник осознаний', description: 'Дневник осознаний, достижений, эмоций и целей для закрепления результатов на материальном носителе', targetId: 'main-instruction-diary' },
    { title: 'Практики', description: 'Самые популярные практики для гармонизации эмоционального состояния и развития навыков', targetId: 'main-instruction-practices' },
    { title: 'Календарь событий', description: 'Календарь событий – приоритетных и ознакомительных. Ниже карточки событий с подробной информацией', targetId: 'main-instruction-schedule' },
];

export const MAIN_INSTRUCTION_STEPS_COUNT = INSTRUCTION_STEPS.length;

interface MainPageInstructionsModalProps {
    currentStep: number;
    onNext: () => void;
    onClose: () => void;
}

export const MainPageInstructionsModal = ({ currentStep, onNext, onClose }: MainPageInstructionsModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
    const step = INSTRUCTION_STEPS[currentStep];

    useEffect(() => {
        const updateArrowPosition = () => {
            const targetEl = document.getElementById(step.targetId);
            const modalEl = modalRef.current;
            if (!targetEl || !modalEl) return;

            const targetRect = targetEl.getBoundingClientRect();
            const modalRect = modalEl.getBoundingClientRect();

            const targetCenterX = targetRect.left + targetRect.width / 2;
            const targetCenterY = targetRect.top + targetRect.height / 2;
            const modalCenterX = modalRect.left + modalRect.width / 2;
            const modalCenterY = modalRect.top + modalRect.height / 2;

            const dx = targetCenterX - modalCenterX;
            const dy = targetCenterY - modalCenterY;
            const angle = Math.atan2(dy, dx);
            const deg = (angle * 180) / Math.PI + 90;

            const arrowSize = 24;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const arrowDistance = Math.min(80, distance / 2);

            setArrowStyle({
                position: 'fixed' as const,
                left: modalCenterX - arrowSize / 2,
                top: modalCenterY - arrowSize / 2 - arrowDistance,
                transform: `rotate(${deg}deg)`,
                width: arrowSize,
                height: arrowSize,
                zIndex: 9999,
                pointerEvents: 'none',
            });
        };

        updateArrowPosition();
        const timer = setTimeout(updateArrowPosition, 100);

        const observer = new ResizeObserver(updateArrowPosition);
        if (modalRef.current) observer.observe(modalRef.current);

        window.addEventListener('scroll', updateArrowPosition, true);
        window.addEventListener('resize', updateArrowPosition);

        return () => {
            clearTimeout(timer);
            observer.disconnect();
            window.removeEventListener('scroll', updateArrowPosition, true);
            window.removeEventListener('resize', updateArrowPosition);
        };
    }, [currentStep, step.targetId]);

    if (!step) return null;

    return (
        <>
            {/* Стрелка к элементу */}
            <div style={arrowStyle} className="text-[#C4841D]">
                <ChevronDown size={24} strokeWidth={2.5} />
            </div>

            {/* Оверлей - клик не закрывает модалку */}
            <div className="fixed inset-0 bg-black/60 z-[9998]" />

            {/* Модальное окно */}
            <div
                ref={modalRef}
                className="fixed z-[9999] left-0 right-0 bottom-0 sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-[#114E50] rounded-t-[24px] sm:rounded-[24px] px-4 pt-6 pb-8 text-left text-white overflow-hidden shadow-xl"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                        <p className="text-gray-300 text-base leading-relaxed">{step.description}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors rounded"
                        aria-label="Закрыть"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="mt-6">
                    <button
                        onClick={onNext}
                        className="w-full px-6 py-2.5 rounded-full bg-[#C4841D] text-white font-medium hover:bg-[#a86f18] transition-colors"
                    >
                        Понятно
                    </button>
                </div>
            </div>
        </>
    );
};

export { INSTRUCTION_STEPS };
