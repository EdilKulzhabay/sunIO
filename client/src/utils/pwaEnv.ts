/**
 * Приложение открыто как PWA с домашнего экрана iOS (не вкладка Safari).
 */
export function isIosPwaStandalone(): boolean {
    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isIos) return false;

    const mq =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(display-mode: standalone)").matches;

    const legacySafari = Boolean(
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );

    return mq || legacySafari;
}
