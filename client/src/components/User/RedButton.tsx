export const RedButton = ({ text, onClick, className, disabled }: { text: string, onClick: () => void, className?: string, disabled?: boolean }) => {
    return (
        <button 
            className={`bg-[#C4841D] text-white py-2.5 text-center font-medium rounded-full ${className}`} 
            onClick={onClick}
            disabled={disabled}
        >{text}</button>
    )
}