import { useEffect, useRef } from 'react';

const SCROLL_TO_END_DURATION = 1200;
const SCROLL_BACK_DELAY = 400;

/**
 * При открытии страницы выполняет автоматический скролл до последнего элемента
 * и возврат к первому. Используется для горизонтальных каруселей с карточками.
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

        hasRunRef.current = true;

        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        if (maxScrollLeft <= 0) return;

        let scrollBackTimer: ReturnType<typeof setTimeout> | null = null;

        const initTimer = setTimeout(() => {
            container.scrollTo({
                left: maxScrollLeft,
                behavior: 'smooth',
            });

            scrollBackTimer = setTimeout(() => {
                container.scrollTo({
                    left: 0,
                    behavior: 'smooth',
                });
            }, SCROLL_TO_END_DURATION + SCROLL_BACK_DELAY);
        }, 400);

        return () => {
            clearTimeout(initTimer);
            if (scrollBackTimer) clearTimeout(scrollBackTimer);
        };
    }, [containerRef, itemCount, isReady]);
}
