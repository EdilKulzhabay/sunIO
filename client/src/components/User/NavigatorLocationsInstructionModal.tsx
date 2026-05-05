import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { DEFAULT_CURVE_BEND } from './MainPageInstructionsModal';

/** Значения по умолчанию — переопределение через prop `arrow`. */
export const DEFAULT_NAVIGATOR_ARROW_SETTINGS = {
    color: '#00C5AE',
    originCircleRadius: 6,
    strokeWidth: 1.5,
    tipInsetPx: 22,
    markerWidth: 6,
    markerHeight: 6,
    markerRefX: 5,
    markerRefY: 3,
} as const;

export interface NavigatorArrowSettings {
    color?: string;
    originCircleRadius?: number;
    strokeWidth?: number;
    tipInsetPx?: number;
    markerWidth?: number;
    markerHeight?: number;
    markerRefX?: number;
    markerRefY?: number;
}

/** Одна локация на карте навигатора — как поля стрелки в `InstructionStep` главной страницы. */
export interface NavigatorLocationSpotStep {
    targetId: string;
    /** Сила изгиба дуги (как `curveBend` в главной инструкции); иначе `DEFAULT_CURVE_BEND`. */
    curveBend?: number;
    /** Смещение точки прицеливания у цели относительно центра элемента (px). */
    originOffsetX?: number;
    originOffsetY?: number;
}

function mergeArrowSettings(overrides?: NavigatorArrowSettings) {
    const d = DEFAULT_NAVIGATOR_ARROW_SETTINGS;
    return {
        color: overrides?.color ?? d.color,
        originCircleRadius: overrides?.originCircleRadius ?? d.originCircleRadius,
        strokeWidth: overrides?.strokeWidth ?? d.strokeWidth,
        tipInsetPx: overrides?.tipInsetPx ?? d.tipInsetPx,
        markerWidth: overrides?.markerWidth ?? d.markerWidth,
        markerHeight: overrides?.markerHeight ?? d.markerHeight,
        markerRefX: overrides?.markerRefX ?? d.markerRefX,
        markerRefY: overrides?.markerRefY ?? d.markerRefY,
    };
}

/**
 * Настройки стрелок к локациям (пересечение с главной страницей).
 * Порядок как на карте навигатора — `curveBend` / `originOffsetX` / `originOffsetY` подбирайте визуально.
 */
export const NAVIGATOR_LOCATION_INSTRUCTION_STEPS: NavigatorLocationSpotStep[] = [
    {
        targetId: 'navigator-instruction-spot-consciousness-library',
        curveBend: 40,
        originOffsetX: 6,
        originOffsetY: -10,
    },
    {
        targetId: 'navigator-instruction-spot-spirit-forge',
        curveBend: 44,
        originOffsetY: -10,
    },
    {
        targetId: 'navigator-instruction-spot-relationship-workshop',
        curveBend: -36,
        originOffsetY: 12,
        originOffsetX: -6,
    },
    {
        targetId: 'navigator-instruction-spot-masters-tower',
        curveBend: 38,
        originOffsetY: 14,
        originOffsetX: 16,
    },
    {
        targetId: 'navigator-instruction-spot-health-lab',
        curveBend: -40,
        originOffsetX: -16,
        originOffsetY: 18,
    },
];

/** Удобный список id для привязок в разметке (дубликаты targetId из шагов). */
export const NAVIGATOR_INSTRUCTION_SPOT_IDS = NAVIGATOR_LOCATION_INSTRUCTION_STEPS.map((s) => s.targetId);

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

export interface NavigatorArrowSegment {
    key: string;
    controlX: number;
    controlY: number;
    lineEndX: number;
    lineEndY: number;
}

interface NavigatorLocationsInstructionModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    /** Шаги: `curveBend`, `originOffsetX`, `originOffsetY` у цели — как в `InstructionStep` главной. */
    steps?: NavigatorLocationSpotStep[];
    /** Цвет линии, толщина, отступ острия и т.д. */
    arrow?: NavigatorArrowSettings;
}

export const NavigatorLocationsInstructionModal = ({
    open,
    onClose,
    title = 'Переход между локациями',
    description = 'Чтобы перейти в локацию с контентом нажмите на соответствующее описание',
    steps = NAVIGATOR_LOCATION_INSTRUCTION_STEPS,
    arrow,
}: NavigatorLocationsInstructionModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const merged = useMemo(() => mergeArrowSettings(arrow), [arrow]);

    const [arrowState, setArrowState] = useState<{
        originX: number;
        originY: number;
        segments: NavigatorArrowSegment[];
    } | null>(null);

    useLayoutEffect(() => {
        if (!open) {
            setArrowState(null);
            return;
        }

        const tipInset = merged.tipInsetPx;

        const updateArrows = () => {
            const modalEl = modalRef.current;
            if (!modalEl) return;

            const modalRect = modalEl.getBoundingClientRect();
            const originX = modalRect.left + modalRect.width / 2;
            const originY = modalRect.top;

            const segments: NavigatorArrowSegment[] = [];

            steps.forEach((step) => {
                const targetEl = document.getElementById(step.targetId);
                if (!targetEl) return;

                const targetRect = targetEl.getBoundingClientRect();
                const targetCenterX = targetRect.left + targetRect.width / 2 + (step.originOffsetX ?? 0);
                const targetCenterY = targetRect.top + targetRect.height / 2 + (step.originOffsetY ?? 0);

                const dx = targetCenterX - originX;
                const dy = targetCenterY - originY;
                const length = Math.sqrt(dx * dx + dy * dy);
                if (length < 5) return;

                const ux = dx / length;
                const uy = dy / length;

                const lineEndX = targetCenterX - tipInset * ux;
                const lineEndY = targetCenterY - tipInset * uy;

                const bend = step.curveBend ?? DEFAULT_CURVE_BEND;
                const { cx: controlX, cy: controlY } = quadraticControl(originX, originY, lineEndX, lineEndY, bend);

                segments.push({
                    key: step.targetId,
                    controlX,
                    controlY,
                    lineEndX,
                    lineEndY,
                });
            });

            if (segments.length === 0) {
                setArrowState(null);
                return;
            }

            setArrowState({ originX, originY, segments });
        };

        updateArrows();
        const t = setTimeout(updateArrows, 80);
        const t2 = setTimeout(updateArrows, 300);

        window.addEventListener('scroll', updateArrows, true);
        window.addEventListener('resize', updateArrows);

        const observer = new ResizeObserver(updateArrows);
        if (modalRef.current) observer.observe(modalRef.current);
        steps.forEach((step) => {
            const el = document.getElementById(step.targetId);
            if (el) observer.observe(el);
        });

        return () => {
            clearTimeout(t);
            clearTimeout(t2);
            window.removeEventListener('scroll', updateArrows, true);
            window.removeEventListener('resize', updateArrows);
            observer.disconnect();
        };
    }, [open, merged, steps]);

    if (!open) return null;

    const markerId = 'navigator-locations-arrowhead';

    const { color: arrowColor, originCircleRadius, strokeWidth } = merged;
    const mw = merged.markerWidth;
    const mh = merged.markerHeight;
    const mrf = merged.markerRefX;
    const mry = merged.markerRefY;

    const layer = (
        <>
            <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={onClose} aria-hidden />

            <div
                ref={modalRef}
                className="fixed z-[9999] left-0 right-0 bottom-0 xl:left-1/2 xl:right-auto xl:bottom-auto xl:top-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2 xl:w-full xl:max-w-md bg-[#114E50] rounded-t-[24px] xl:rounded-[24px] px-4 pt-6 pb-8 text-left text-white overflow-hidden shadow-xl mx-0"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-bold flex-1 min-w-0 pr-2">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors rounded"
                        aria-label="Закрыть"
                    >
                        <X size={24} />
                    </button>
                </div>
                <p className="text-gray-300 text-base leading-relaxed mt-2">{description}</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full mt-6 px-6 py-2.5 rounded-full bg-[#C4841D] text-white font-medium hover:bg-[#a86f18] transition-colors"
                >
                    Понятно
                </button>
            </div>

            {arrowState && arrowState.segments.length > 0 && (
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
                    aria-hidden
                >
                    <defs>
                        <marker
                            id={markerId}
                            markerWidth={mw}
                            markerHeight={mh}
                            refX={mrf}
                            refY={mry}
                            orient="auto"
                        >
                            <polygon
                                points={`0 0, ${mw} ${mh / 2}, 0 ${mh}`}
                                fill={arrowColor}
                            />
                        </marker>
                    </defs>
                    <circle
                        cx={arrowState.originX}
                        cy={arrowState.originY}
                        r={originCircleRadius}
                        fill={arrowColor}
                    />
                    {arrowState.segments.map((seg) => (
                        <path
                            key={seg.key}
                            d={`M ${arrowState.originX} ${arrowState.originY} Q ${seg.controlX} ${seg.controlY} ${seg.lineEndX} ${seg.lineEndY}`}
                            fill="none"
                            stroke={arrowColor}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            markerEnd={`url(#${markerId})`}
                        />
                    ))}
                </svg>
            )}
        </>
    );

    return typeof document !== 'undefined' ? createPortal(layer, document.body) : null;
};
