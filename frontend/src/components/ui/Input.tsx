"use client";
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
                    <label 
                        htmlFor={props.id}
                        className="block text-[10px] font-black text-[#777777] mb-2 uppercase tracking-[0.2em] ml-1"
                    >
                        {label}
                    </label>
                )}
                <input
                    id={props.id}
                    ref={ref}
                    className={cn(
                        'w-full px-6 py-4 bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/5 transition-all text-[#111111] font-bold placeholder-[#999999] disabled:bg-gray-100 disabled:text-gray-400',
                        error ? 'border-red-500 focus:ring-red-500/10' : 'border-gray-200 focus:border-primary-500/20 focus:bg-gray-50/10',
                        className
                    )}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </div>
        );
    }
);
