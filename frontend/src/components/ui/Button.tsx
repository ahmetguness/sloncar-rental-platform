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
        primary: 'bg-primary-500 text-white hover:bg-primary-600 border border-primary-500/50 shadow-sm hover:scale-[1.02] active:scale-[0.98]',
        secondary: 'bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5] hover:bg-[#EEEEEE] active:scale-[0.98]',
        outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-500/10 bg-transparent',
        danger: 'bg-red-500 text-white hover:bg-red-600 border border-red-500/50',
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
