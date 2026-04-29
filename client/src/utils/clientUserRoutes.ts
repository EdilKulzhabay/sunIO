/**
 * Экраны, где не нужен верхний inset в PWA на iOS (см. UserIosPwaTopInset).
 */
const USER_IOS_PWA_TOP_INSET_EXCLUDE = new Set<string>([
    "/",
    "/client/telegram-auth",
    "/client-performance",
    "/client/register",
    "/client/region",
]);

export function pathnameExcludesUserIosPwaTopInset(pathname: string): boolean {
    return USER_IOS_PWA_TOP_INSET_EXCLUDE.has(pathname);
}

/**
 * Маршруты с экранами из `pages/User` (клиентское приложение, не админка и не /login|/register).
 */
export function pathnameIsClientUserAppPage(pathname: string): boolean {
    if (pathname.startsWith("/admin")) return false;
    if (pathname === "/login" || pathname === "/register") return false;
    if (pathname.startsWith("/robokassa_callback")) return false;
    if (pathname === "/" || pathname === "/main" || pathname === "/about" || pathname === "/client-performance") {
        return true;
    }
    if (pathname.startsWith("/client")) return true;
    return false;
}
