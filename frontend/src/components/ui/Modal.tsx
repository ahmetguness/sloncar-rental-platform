import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl'
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative w-full ${sizeClasses[size]} bg-white border border-[#E5E5E5] rounded-2xl shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh] mx-2 sm:mx-0`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#E5E5E5] bg-[#F5F5F5]">
                    <h2 className="text-lg sm:text-xl font-bold text-[#111111] tracking-tight pr-2">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[#F5F5F5] text-[#777777] hover:text-[#111111] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
