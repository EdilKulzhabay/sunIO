import { Link } from "react-router-dom"

export const MyLink = ({ to, text, className, color }: { to: string, text: string, className?: string, color?: string }) => {
    return (
        <Link 
            to={to} 
            className={`${color === 'red' ? 'bg-[#EC1313]' : 'bg-white/10'} block text-white py-2.5 text-center font-medium rounded-full ${className}`}
        >
            {text}
        </Link>
    );
};