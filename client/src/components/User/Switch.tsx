export const Switch = ({ checked, onChange, className }: { checked: boolean, onChange: () => void, className?: string }) => {
    return (
        <button className={`relative w-10 h-6 rounded-full p-1 ${checked ? 'bg-[#EC1313]' : 'bg-white/10'} ${className}`} onClick={onChange}>
            <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${checked ? 'translate-x-full' : 'translate-x-0'}`} />
        </button>
    )
}