import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export type ArrowOrigin = 'left-of-close' | 'center';

export interface InstructionStep {
    title: string;
    description: string;
    targetId: string;
    arrowOrigin?: ArrowOrigin;
}

const INSTRUCTION_STEPS: InstructionStep[] = [
    { title: 'Профиль пользователя', description: 'Настройки Приложения, внутренний баланс, пригласительная ссылка, ссылки на ресурсы', targetId: 'main-instruction-profile', arrowOrigin: 'left-of-close' },
    { title: 'Часто задаваемые вопросы', description: 'Ответы на частые вопросы, инструкция по работе с Приложением и контакты для связи', targetId: 'main-instruction-faq', arrowOrigin: 'left-of-close' },
    { title: 'Каталог платных продуктов', description: 'Перечень платных продуктов для покупок через списание с внутреннего баланса Приложения', targetId: 'main-instruction-product-catalog', arrowOrigin: 'left-of-close' },
    { title: 'Сообщество', description: 'Сообщество — это поддерживающее пространство для своих людей, кто уже прошёл Активацию', targetId: 'main-instruction-community', arrowOrigin: 'left-of-close' },
    { title: 'Навигатор', description: 'Переключение между пространствами пробуждения сознания через разные темы', targetId: 'main-instruction-navigator', arrowOrigin: 'left-of-close' },
    { title: 'Задания', description: 'Последовательность заданий в зависимости от вашего запроса, помогает всё делать последовательно', targetId: 'main-instruction-tasks', arrowOrigin: 'left-of-close' },
    { title: 'Дневник осознаний', description: 'Дневник осознаний, достижений, эмоций и целей для закрепления результатов на материальном носителе', targetId: 'main-instruction-diary', arrowOrigin: 'left-of-close' },
    { title: 'Практики', description: 'Самые популярные практики для гармонизации эмоционального состояния и развития навыков', targetId: 'main-instruction-practices', arrowOrigin: 'left-of-close' },
    { title: 'Календарь событий', description: 'Календарь событий – приоритетных и ознакомительных. Ниже карточки событий с подробной информацией', targetId: 'main-instruction-schedule', arrowOrigin: 'left-of-close' },
];

export const MAIN_INSTRUCTION_STEPS_COUNT = INSTRUCTION_STEPS.length;

interface MainPageInstructionsModalProps {
    currentStep: number;
    onNext: () => void;
    onClose: () => void;
}

const ARROW_COLOR = '#00C5AE';
const CIRCLE_RADIUS = 3.5;
const LINE_OFFSET_FROM_TARGET = 8;

export const MainPageInstructionsModal = ({ currentStep, onNext, onClose }: MainPageInstructionsModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const [arrowState, setArrowState] = useState<{
        originX: number;
        originY: number;
        lineEndX: number;
        lineEndY: number;
    } | null>(null);

    const step = INSTRUCTION_STEPS[currentStep];

    useEffect(() => {
        const updateArrowPosition = () => {
            const targetEl = document.getElementById(step.targetId);
            const modalEl = modalRef.current;
            const closeBtn = closeButtonRef.current;
            if (!targetEl || !modalEl) return;

            const targetRect = targetEl.getBoundingClientRect();
            const modalRect = modalEl.getBoundingClientRect();

            const targetCenterX = targetRect.left + targetRect.width / 2;
            const targetCenterY = targetRect.top + targetRect.height / 2;

            let originX: number;
            let originY: number;

            const useLeftOfClose = (step.arrowOrigin ?? 'left-of-close') === 'left-of-close' && closeBtn;

            if (useLeftOfClose && closeBtn) {
                const closeRect = closeBtn.getBoundingClientRect();
                originX = closeRect.left - 20;
                originY = closeRect.top + closeRect.height / 2;
            } else {
                originX = modalRect.left + modalRect.width / 2;
                originY = modalRect.top + modalRect.height / 2;
            }

            const dx = targetCenterX - originX;
            const dy = targetCenterY - originY;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length < 5) return;

            const ux = dx / length;
            const uy = dy / length;

            const lineEndX = targetCenterX - LINE_OFFSET_FROM_TARGET * ux;
            const lineEndY = targetCenterY - LINE_OFFSET_FROM_TARGET * uy;

            setArrowState({
                originX,
                originY,
                lineEndX,
                lineEndY,
            });
        };

        updateArrowPosition();
        const timer = setTimeout(updateArrowPosition, 100);

        const observer = new ResizeObserver(updateArrowPosition);
        if (modalRef.current) observer.observe(modalRef.current);
        const closeBtnEl = closeButtonRef.current;
        if (closeBtnEl) observer.observe(closeBtnEl);

        window.addEventListener('scroll', updateArrowPosition, true);
        window.addEventListener('resize', updateArrowPosition);

        return () => {
            clearTimeout(timer);
            observer.disconnect();
            window.removeEventListener('scroll', updateArrowPosition, true);
            window.removeEventListener('resize', updateArrowPosition);
        };
    }, [currentStep, step.targetId, step.arrowOrigin]);

    if (!step) return null;

    return (
        <>
            {/* Оверлей */}
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
                        ref={closeButtonRef}
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

            {/* Стрелка: круг у начала (левее крестика) → линия → остриё у иконки */}
            {arrowState && (
                <svg
                    style={{
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 10001,
                        pointerEvents: 'none',
                        overflow: 'visible',
                    }}
                >
                    <defs>
                        <marker
                            id="main-instruction-arrowhead"
                            markerWidth="6"
                            markerHeight="6"
                            refX="5"
                            refY="3"
                            orient="auto"
                        >
                            <polygon points="0 0, 6 3, 0 6" fill={ARROW_COLOR} />
                        </marker>
                    </defs>
                    <circle
                        cx={arrowState.originX}
                        cy={arrowState.originY}
                        r={CIRCLE_RADIUS}
                        fill={ARROW_COLOR}
                    />
                    <line
                        x1={arrowState.originX}
                        y1={arrowState.originY}
                        x2={arrowState.lineEndX}
                        y2={arrowState.lineEndY}
                        stroke={ARROW_COLOR}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        markerEnd="url(#main-instruction-arrowhead)"
                    />
                </svg>
            )}
        </>
    );
};

export { INSTRUCTION_STEPS };
