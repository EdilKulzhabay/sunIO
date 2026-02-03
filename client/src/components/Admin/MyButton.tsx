export const MyButton = ({ 
    text, 
    onClick, 
    className, 
    disabled, 
    type = 'button' 
}: { 
    text: string, 
    onClick?: () => void, 
    className?: string, 
    disabled?: boolean,
    type?: 'button' | 'submit' | 'reset'
}) => {
    return (
        <button 
            type={type}
            className={`w-full p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`} 
            onClick={onClick}
            disabled={disabled}
        >{text}</button>
    )
}