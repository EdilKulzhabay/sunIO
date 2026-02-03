export const RedButton = ({ text, onClick, className, disabled }: { text: string, onClick: () => void, className?: string, disabled?: boolean }) => {
    return (
        <button 
            className={`bg-[#EC1313] text-white py-2.5 text-center font-medium rounded-full ${className}`} 
            onClick={onClick}
            disabled={disabled}
        >{text}</button>
    )
}