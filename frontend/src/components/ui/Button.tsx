import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
}

export const Button = ({
    className,
    variant = 'primary',
    size = 'md',
    children,
    ...props
}: ButtonProps) => {
    const variants = {
        primary: 'bg-primary-600 text-white hover:bg-primary-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] border border-primary-500/50 hover:scale-[1.02] active:scale-[0.98]',
        secondary: 'bg-white/10 text-white border border-white/10 hover:bg-white/20 hover:border-white/30 backdrop-blur-md shadow-lg active:scale-[0.98]',
        outline: 'border-2 border-primary-500 text-primary-400 hover:bg-primary-500/10 hover:text-primary-300 hover:border-primary-400 bg-transparent shadow-[0_0_10px_rgba(99,102,241,0.1)]',
        danger: 'bg-red-500/80 text-white hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-red-500/50',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-8 py-3.5 text-base',
    };

    return (
        <button
            className={cn(
                'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};
