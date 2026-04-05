import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export type ArrowOrigin = 'left-of-close' | 'center';

export interface InstructionStep {
    title: string;
    description: string;
    targetId: string;
    /** Откуда выходит линия: центр модалки (по умолчанию) или слева от крестика */
    arrowOrigin?: ArrowOrigin;
    /**
     * Изгиб дуги (px): смещение контрольной точки квадратичной Безье вдоль нормали к хорде.
     * 0 — почти прямая; положительное — дуга в одну сторону, отрицательное — в другую.
     * Если не задано — используется DEFAULT_CURVE_BEND.
     */
    curveBend?: number;
}

/** Дуга по умолчанию, если в шаге не указан `curveBend` (можно импортировать и подставлять в свои шаги). */
export const DEFAULT_CURVE_BEND = 48;

const INSTRUCTION_STEPS: InstructionStep[] = [
    {
        title: 'Профиль пользователя',
        description:
            'Настройки Приложения, внутренний баланс, пригласительная ссылка, ссылки на ресурсы',
        targetId: 'main-instruction-profile',
        curveBend: 52,
    },
    {
        title: 'Часто задаваемые вопросы',
        description: 'Ответы на частые вопросы, инструкция по работе с Приложением и контакты для связи',
        targetId: 'main-instruction-faq',
        curveBend: -44,
    },
    {
        title: 'Каталог платных продуктов',
        description: 'Перечень платных продуктов для покупок через списание с внутреннего баланса Приложения',
        targetId: 'main-instruction-product-catalog',
        curveBend: 56,
    },
    {
        title: 'Сообщество',
        description:
            'Сообщество — это поддерживающее пространство для своих людей, кто уже прошёл Активацию',
        targetId: 'main-instruction-community',
        curveBend: -48,
    },
    {
        title: 'Навигатор',
        description: 'Переключение между пространствами пробуждения сознания через разные темы',
        targetId: 'main-instruction-navigator',
        curveBend: 50,
    },
    {
        title: 'Задания',
        description:
            'Последовательность заданий в зависимости от вашего запроса, помогает всё делать последовательно',
        targetId: 'main-instruction-tasks',
        curveBend: -42,
    },
    {
        title: 'Дневник осознаний',
        description:
            'Дневник осознаний, достижений, эмоций и целей для закрепления результатов на материальном носителе',
        targetId: 'main-instruction-diary',
        curveBend: 54,
    },
    {
        title: 'Практики',
        description:
            'Самые популярные практики для гармонизации эмоционального состояния и развития навыков',
        targetId: 'main-instruction-practices',
        curveBend: -46,
    },
    {
        title: 'Календарь событий',
        description:
            'Календарь событий – приоритетных и ознакомительных. Ниже карточки событий с подробной информацией',
        targetId: 'main-instruction-schedule',
        curveBend: 48,
    },
];

export const MAIN_INSTRUCTION_STEPS_COUNT = INSTRUCTION_STEPS.length;

interface MainPageInstructionsModalProps {
    currentStep: number;
    onNext: () => void;
    onClose: () => void;
}

const ARROW_COLOR = '#00C5AE';
const CIRCLE_RADIUS = 6;
const LINE_OFFSET_FROM_TARGET = 22;

/** Контрольная точка Q для дуги от (ox,oy) до (ex,ey); bend — смещение вдоль левой нормали к хорде */
function quadraticControl(
    ox: number,
    oy: number,
    ex: number,
    ey: number,
    bend: number
): { cx: number; cy: number } {
    const dx = ex - ox;
    const dy = ey - oy;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-6) return { cx: (ox + ex) / 2, cy: (oy + ey) / 2 };
    const mx = (ox + ex) / 2;
    const my = (oy + ey) / 2;
    const nx = -dy / len;
    const ny = dx / len;
    return { cx: mx + bend * nx, cy: my + bend * ny };
}

export const MainPageInstructionsModal = ({ currentStep, onNext, onClose }: MainPageInstructionsModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const [arrowState, setArrowState] = useState<{
        originX: number;
        originY: number;
        controlX: number;
        controlY: number;
        lineEndX: number;
        lineEndY: number;
    } | null>(null);

    const step = INSTRUCTION_STEPS[currentStep];

    useEffect(() => {
        if (!step) return;
        const targetEl = document.getElementById(step.targetId);
        if (targetEl) {
            const timer = setTimeout(() => {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [currentStep, step?.targetId]);

    useEffect(() => {
        if (!step) return;

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

            const useLeftOfClose = (step.arrowOrigin ?? 'center') === 'left-of-close' && closeBtn;

            if (useLeftOfClose && closeBtn) {
                const closeRect = closeBtn.getBoundingClientRect();
                originX = closeRect.left - 20;
                originY = closeRect.top + closeRect.height / 2;
            } else {
                originX = modalRect.left + modalRect.width / 2;
                originY = modalRect.top ;
            }

            const dx = targetCenterX - originX;
            const dy = targetCenterY - originY;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length < 5) return;

            const ux = dx / length;
            const uy = dy / length;

            const lineEndX = targetCenterX - LINE_OFFSET_FROM_TARGET * ux;
            const lineEndY = targetCenterY - LINE_OFFSET_FROM_TARGET * uy;

            const bend = step.curveBend ?? DEFAULT_CURVE_BEND;
            const { cx: controlX, cy: controlY } = quadraticControl(originX, originY, lineEndX, lineEndY, bend);

            setArrowState({
                originX,
                originY,
                controlX,
                controlY,
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
        const targetEl = document.getElementById(step.targetId);
        if (targetEl) observer.observe(targetEl);

        window.addEventListener('scroll', updateArrowPosition, true);
        window.addEventListener('resize', updateArrowPosition);

        return () => {
            clearTimeout(timer);
            observer.disconnect();
            window.removeEventListener('scroll', updateArrowPosition, true);
            window.removeEventListener('resize', updateArrowPosition);
        };
    }, [currentStep, step.targetId, step.arrowOrigin, step.curveBend]);

    if (!step) return null;

    const markerId = `main-instruction-arrowhead-${currentStep}`;

    return (
        <>
            {/* Оверлей */}
            <div className="fixed inset-0 bg-black/60 z-[9998]" />

            {/* Модальное окно */}
            <div
                ref={modalRef}
                className="fixed z-[9999] left-0 right-0 bottom-0 xl:left-1/2 xl:right-auto xl:bottom-auto xl:top-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2 xl:w-full xl:max-w-md bg-[#114E50] rounded-t-[24px] xl:rounded-[24px] px-4 pt-6 pb-8 text-left text-white overflow-hidden shadow-xl"
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

            {/* Дуга: круг в центре модалки (или у крестика) → кривая Безье → остриё у цели */}
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
                            id={markerId}
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
                    <path
                        d={`M ${arrowState.originX} ${arrowState.originY} Q ${arrowState.controlX} ${arrowState.controlY} ${arrowState.lineEndX} ${arrowState.lineEndY}`}
                        fill="none"
                        stroke={ARROW_COLOR}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        markerEnd={`url(#${markerId})`}
                    />
                </svg>
            )}
        </>
    );
};

export { INSTRUCTION_STEPS };
