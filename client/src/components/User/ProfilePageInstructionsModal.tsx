import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const INSTRUCTION_STEPS = [
    { title: 'Солнца', description: 'Внутренняя валюта приложения, которую можно обменять на эксклюзивный контент. Нажми на этот блок, чтобы узнать политику получения Солнц', targetId: 'profile-instruction-sun' },
    { title: 'Подписка на клуб', description: 'Статус подписки на закрытый клуб Мастерская энергий, доступ в который возможен после Активации', targetId: 'profile-instruction-subscription' },
    { title: 'Реферальная ссылка', description: 'Твоя персональная ссылка для друзей, нажми на цифру, чтобы посмотреть статусы приглашений', targetId: 'profile-instruction-referral-link' },
    { title: 'Телеграм канал', description: 'Информационный канал, где публикуется интересный контент, которого нет в других социальных сетях', targetId: 'profile-instruction-telegram-channel' },
    { title: 'Телеграм чат', description: 'Чат проекта, где можно задавать вопросы ведущим проекта и делиться обратной связью', targetId: 'profile-instruction-telegram-chat' },
    { title: 'Настройка просмотра видео', description: 'В РФ запрещён к использованию YouTube, при включенном параметре будут активны RuTube ссылки', targetId: 'profile-instruction-video-settings' },
    { title: 'Уведомления', description: 'Разрешаете или нет Приложению отправлять различные уведомления через Телеграм-бота', targetId: 'profile-instruction-notifications' },
];

export const PROFILE_INSTRUCTION_STEPS_COUNT = INSTRUCTION_STEPS.length;

interface ProfilePageInstructionsModalProps {
    currentStep: number;
    onNext: () => void;
    onClose: () => void;
}

const ARROW_COLOR = '#00C5AE';
const CIRCLE_RADIUS = 3.5;
const LINE_OFFSET_FROM_TARGET = 8;

export const ProfilePageInstructionsModal = ({ currentStep, onNext, onClose }: ProfilePageInstructionsModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const [arrowState, setArrowState] = useState<{
        originX: number;
        originY: number;
        lineEndX: number;
        lineEndY: number;
    } | null>(null);

    const step = INSTRUCTION_STEPS[currentStep];

    // Скролл к целевому элементу при смене шага (с задержкой для применения padding)
    useEffect(() => {
        if (!step) return;
        const targetEl = document.getElementById(step.targetId);
        if (targetEl) {
            const timer = setTimeout(() => {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

            const closeRect = closeBtn?.getBoundingClientRect();
            const originX = closeRect ? closeRect.left - 20 : modalRect.left + modalRect.width / 2;
            const originY = closeRect ? closeRect.top + closeRect.height / 2 : modalRect.top + modalRect.height / 2;

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
    }, [currentStep, step?.targetId]);

    if (!step) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[9998]" />

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
                <div className="mt-6 flex items-center justify-between">
                    <button
                        onClick={onNext}
                        className="w-full px-6 py-2.5 rounded-full bg-[#C4841D] text-white font-medium hover:bg-[#a86f18] transition-colors"
                    >
                        Понятно
                    </button>
                </div>
            </div>

            {/* Стрелка: круг у начала (левее крестика) → линия → остриё у элемента */}
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
                            id="profile-instruction-arrowhead"
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
                        markerEnd="url(#profile-instruction-arrowhead)"
                    />
                </svg>
            )}
        </>
    );
};
