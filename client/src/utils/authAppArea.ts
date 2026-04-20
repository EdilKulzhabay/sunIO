/**
 * Маршруты админки (`pages/Admin`) — без жёсткой клиентской гигиены сессии,
 * применяемой к клиентскому приложению (`pages/User`).
 */
export function isAdminAppPath(pathname: string): boolean {
    const p = pathname || "/";
    return p === "/admin" || p.startsWith("/admin/");
}
