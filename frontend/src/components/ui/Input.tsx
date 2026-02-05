import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={cn(
                        'w-full px-4 py-3 bg-dark-bg border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-white placeholder-gray-600 disabled:bg-gray-800 disabled:text-gray-500',
                        error ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-transparent',
                        className
                    )}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </div>
        );
    }
);
