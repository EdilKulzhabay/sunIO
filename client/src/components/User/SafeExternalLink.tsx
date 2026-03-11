import { openExternalLink } from '../../utils/telegramWebApp';

interface SafeExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    children: React.ReactNode;
}

/**
 * Ссылка для клиентской части: при клике открывает href через openExternalLink,
 * чтобы ссылки на t.me открывались в Telegram, остальные — в браузере.
 */
export const SafeExternalLink = ({ href, children, onClick, ...props }: SafeExternalLinkProps) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
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
