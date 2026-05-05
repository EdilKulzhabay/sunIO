import { useRef, useEffect, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const MyInput = ({ label, type, value, placeholder, onChange, required, min, hasError }: { label: string, type: string, value: string, placeholder?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean, min?: string, hasError?: boolean }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    useEffect(() => {
        const input = inputRef.current;
        if (!input || type !== 'number') return;
        const handler = (e: WheelEvent) => e.preventDefault();
        input.addEventListener('wheel', handler, { passive: false });
        return () => input.removeEventListener('wheel', handler);
    }, [type]);

    return (
        <div className="flex flex-col gap-2 w-full">
            <label htmlFor={id} className="text-sm font-medium">{label}</label>
            <div className="relative w-full">
                <input
                    ref={inputRef}
                    id={id}
                    type={isPassword && showPassword ? 'text' : type}
                    value={value}
                    onChange={onChange}
                    className={`w-full p-2 rounded-md border ${isPassword ? 'pr-10' : ''} ${hasError ? 'border-2 border-red-500' : 'border-gray-300'}`}
                    placeholder={placeholder}
                    required={required}
                    min={min}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                        aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
};