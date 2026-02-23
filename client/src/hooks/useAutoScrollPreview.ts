import { useEffect, useRef } from 'react';

const DELAY_BETWEEN_CARDS_MS = 1000;
const INITIAL_DELAY_MS = 400;

/**
 * При открытии страницы выполняет автоматический скролл по карточкам по одной
 * с задержкой 1 сек, затем возврат к первому. Используется для горизонтальных каруселей.
 */
export function useAutoScrollPreview(
    containerRef: React.RefObject<HTMLDivElement | null>,
    itemCount: number,
    isReady: boolean = true
) {
    const hasRunRef = useRef(false);

    useEffect(() => {
        if (!isReady || itemCount === 0 || hasRunRef.current) return;

        const container = containerRef.current;
        if (!container) return;

        const cards = container.querySelectorAll('[data-card]');
        if (cards.length === 0) return;

        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        if (maxScrollLeft <= 0) return;

        hasRunRef.current = true;

        const positions = Array.from(cards).map((card) =>
            Math.min((card as HTMLElement).offsetLeft, maxScrollLeft)
        );
        const uniquePositions = [...new Set(positions)].filter((p) => p >= 0).sort((a, b) => a - b);

        let timeouts: ReturnType<typeof setTimeout>[] = [];

        const runScroll = () => {
            // Скролл вперёд
            uniquePositions.forEach((pos, i) => {
                const t = setTimeout(() => {
                    container.scrollTo({ left: pos, behavior: 'smooth' });
                }, INITIAL_DELAY_MS + i * DELAY_BETWEEN_CARDS_MS);
                timeouts.push(t);
            });

            // Скролл назад (от предпоследней позиции до 0)
            const startBackIdx = uniquePositions.length;
            const backPositions = [...uniquePositions].reverse().slice(1);
            backPositions.forEach((pos, i) => {
                const t = setTimeout(() => {
                    container.scrollTo({ left: pos, behavior: 'smooth' });
                }, INITIAL_DELAY_MS + (startBackIdx + i) * DELAY_BETWEEN_CARDS_MS);
                timeouts.push(t);
            });
        };

        const initTimer = setTimeout(runScroll, 0);

        return () => {
            clearTimeout(initTimer);
            timeouts.forEach(clearTimeout);
        };
    }, [containerRef, itemCount, isReady]);
}
