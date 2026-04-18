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
