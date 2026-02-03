export const ClientInput = ({ 
    placeholder, 
    onChange, 
    className, 
    inputType,
    value,
    disabled,
    maxLength
} : { 
    placeholder: string, 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
    className: string, 
    inputType: string,
    value?: string,
    disabled?: boolean,
    maxLength?: number
}) => {
    return (
        <input
            type={inputType}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e)}
            disabled={disabled}
            maxLength={maxLength}
            className={`w-full rounded-full text-white px-4 pt-2 pb-2.5 border border-white/40 focus:outline-none focus:border-white/80 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        />
    )
} 