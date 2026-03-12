import { openExternalLink } from '../../utils/telegramWebApp';

interface SafeExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    children: React.ReactNode;
}

const isMailOrTel = (url: string) => {
    const u = (url || '').trim().toLowerCase();
    return u.startsWith('mailto:') || u.startsWith('tel:');
};

/**
 * Ссылка для клиентской части: при клике открывает href через openExternalLink,
 * чтобы ссылки на t.me открывались в Telegram, остальные — в браузере.
 * mailto: и tel: не перехватываются — открываются нативно (почта, звонилка).
 */
export const SafeExternalLink = ({ href, children, onClick, ...props }: SafeExternalLinkProps) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (isMailOrTel(href)) {
            onClick?.(e);
            return;
        }
        e.preventDefault();
        openExternalLink(href);
        onClick?.(e);
    };
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            {...props}
        >
            {children}
        </a>
    );
};
