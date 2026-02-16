import { useRef, useEffect, useId } from 'react';

export const MyInput = ({ label, type, value, placeholder, onChange, required, min }: { label: string, type: string, value: string, placeholder?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean, min?: string }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const id = useId();

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
            <input
                ref={inputRef}
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                className="w-full p-2 rounded-md border border-gray-300"
                placeholder={placeholder}
                required={required}
                min={min}
            />
        </div>
    );
};