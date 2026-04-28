import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { ArrowOrigin } from './MainPageInstructionsModal';
import { DEFAULT_CURVE_BEND } from './MainPageInstructionsModal';

export interface ProfileInstructionStep {
    title: string;
    description: string;
    targetId: string;
    arrowOrigin?: ArrowOrigin;
    curveBend?: number;
    /** Смещение точки прицеливания по центру цели относительно элемента (px). */
    originOffsetX?: number;
    originOffsetY?: number;
}

const INSTRUCTION_STEPS: ProfileInstructionStep[] = [
    {
        title: 'Внутренний баланс',
        description:
            'Пополнение внутреннего баланса и история покупок продуктов в Приложении',
        targetId: 'profile-instruction-balance',
        curveBend: 48,
    },
    {
        title: 'Солнца',
        description:
            'Внутренняя валюта приложения, которую можно обменять на эксклюзивный контент. Нажми на этот блок, чтобы узнать политику получения Солнц',
        targetId: 'profile-instruction-sun',
        curveBend: -52,
    },
    {
        title: 'Подписка на клуб',
        description:
            'Статус подписки на закрытый клуб Мастерская энергий, доступ в который возможен после Активации',
        targetId: 'profile-instruction-subscription',
        curveBend: 44,
    },
    {
        title: 'Реферальная ссылка',
        description: 'Твоя персональная ссылка для друзей, нажми на цифру, чтобы посмотреть статусы приглашений',
        targetId: 'profile-instruction-referral-link',
        curveBend: -50,
    },
    {
        title: 'Открытый канал',
        description:
            'Публичный канал с контентом, которого нет в других социальных сетях — открывается по ссылке в Telegram',
        targetId: 'profile-instruction-telegram-open-channel',
        curveBend: 46,
    },
    {
        title: 'Открытый чат',
        description: 'Общий чат проекта: вопросы ведущим и обратная связь',
        targetId: 'profile-instruction-telegram-open-chat',
        curveBend: -48,
    },
    {
        title: 'Настройка просмотра видео',
        description: 'В РФ запрещён к использованию YouTube, при включенном параметре будут активны RuTube ссылки',
        targetId: 'profile-instruction-video-settings',
        curveBend: 42,
        originOffsetY: -20,
        originOffsetX: 55,
    },
    {
        title: 'Уведомления',
        description: 'Разрешаете или нет Приложению отправлять различные уведомления через Телеграм-бота',
        targetId: 'profile-instruction-notifications',
        curveBend: -54,
        originOffsetY: -20,
    },
];

export const PROFILE_INSTRUCTION_STEPS_COUNT = INSTRUCTION_STEPS.length;

interface ProfilePageInstructionsModalProps {
    currentStep: number;
    onNext: () => void;
    onClose: () => void;
}

const ARROW_COLOR = '#00C5AE';
const CIRCLE_RADIUS = 6;
const LINE_OFFSET_FROM_TARGET = 22;

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

export const ProfilePageInstructionsModal = ({ currentStep, onNext, onClose }: ProfilePageInstructionsModalProps) => {
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
                const rect = targetEl.getBoundingClientRect();
                const modalHeight = modalRef.current?.getBoundingClientRect().height ?? 0;
                const visibleBottom = window.innerHeight - modalHeight;
                const inView = rect.top >= 0 && rect.bottom <= visibleBottom;
                if (!inView) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
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

            const targetCenterX = targetRect.left + targetRect.width / 2 + (step.originOffsetX ?? 0);
            const targetCenterY = targetRect.top + targetRect.height / 2 + (step.originOffsetY ?? 0);

            let originX: number;
            let originY: number;

            const useLeftOfClose = (step.arrowOrigin ?? 'center') === 'left-of-close' && closeBtn;

            if (useLeftOfClose && closeBtn) {
                const closeRect = closeBtn.getBoundingClientRect();
                originX = closeRect.left - 20;
                originY = closeRect.top + closeRect.height / 2;
            } else {
                originX = modalRect.left + modalRect.width / 2;
                originY = modalRect.top;
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
    }, [
        currentStep,
        step?.targetId,
        step?.arrowOrigin,
        step?.curveBend,
        step?.originOffsetX,
        step?.originOffsetY,
    ]);

    if (!step) return null;

    const markerId = `profile-instruction-arrowhead-${currentStep}`;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[9998]" />

            <div
                ref={modalRef}
                className="fixed z-[9999] left-0 right-0 bottom-0 xl:left-1/2 xl:right-auto xl:bottom-auto xl:top-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2 xl:w-full xl:max-w-md bg-[#114E50] rounded-t-[24px] xl:rounded-[24px] px-4 pt-6 pb-8 text-left text-white overflow-hidden shadow-xl"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                        
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
                <p className="text-gray-300 text-base leading-relaxed">{step.description}</p>
                <div className="mt-6 flex items-center justify-between">
                    <button
                        onClick={onNext}
                        className="w-full px-6 py-2.5 rounded-full bg-[#C4841D] text-white font-medium hover:bg-[#a86f18] transition-colors"
                    >
                        Понятно
                    </button>
                </div>
            </div>

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
