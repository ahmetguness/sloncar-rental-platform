import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface DebouncedInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    debounce?: number;
}

const DebouncedInput: React.FC<DebouncedInputProps> = ({
    value: initialValue,
    onChange,
    placeholder = 'Ara...',
    className = '',
    debounce = 500
}) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value);
        }, debounce);

        return () => clearTimeout(timeout);
    }, [value, debounce, onChange]);

    return (
        <div className={`relative w-full ${className}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-dark-bg/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
            />
            {value && (
                <button
                    onClick={() => setValue('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default DebouncedInput;
