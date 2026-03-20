"use client";
import React from 'react';
import { Skeleton } from '../ui/Skeleton';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
    title: string;
    value?: string | number;
    icon: React.ReactNode;
    color: 'green' | 'blue' | 'purple' | 'orange';
    loading?: boolean;
    trend?: string;
    trendUp?: boolean;
    data?: number[];
    onClick?: () => void;
    isActive?: boolean;
}

export const StatCard = ({ title, value, icon, color, loading, trend, trendUp, data, onClick, isActive }: StatCardProps) => {
    const colorClasses = {
        green: 'from-green-500/20 to-transparent border-green-500/30 text-green-400',
        blue: 'from-blue-500/20 to-transparent border-blue-500/30 text-blue-400',
        purple: 'from-purple-500/20 to-transparent border-purple-500/30 text-purple-400',
        orange: 'from-orange-500/20 to-transparent border-orange-500/30 text-orange-400',
    };

    const iconBgClasses = {
        green: 'bg-green-500/20 text-green-400',
        blue: 'bg-blue-500/20 text-blue-400',
        purple: 'bg-purple-500/20 text-purple-400',
        orange: 'bg-orange-500/20 text-orange-400',
    };

    // Use string manipulation instead of template literals for dynamic ring/shadow classes if needed, 
    // but here we just use the fixed mapping.
    const activeRingClasses = {
        green: 'ring-green-500 border-green-500',
        blue: 'ring-blue-500 border-blue-500',
        purple: 'ring-purple-500 border-purple-500',
        orange: 'ring-orange-500 border-orange-500',
    };

    const activeClasses = isActive
        ? `ring-2 ${activeRingClasses[color]} bg-white/[0.08]`
        : 'hover:bg-black/[0.02] border-gray-200 hover:border-gray-300';

    return (
        <button
            onClick={onClick}
            className={`relative w-full text-left overflow-hidden bg-white p-4 md:p-6 rounded-2xl border transition-all duration-300 group ${activeClasses}`}
        >
            {/* Glow Effect */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgClasses[color]} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {icon}
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {trend}
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <p className="text-gray-600 text-sm font-medium tracking-wide">{title}</p>
                    {loading ? (
                        <Skeleton className="h-8 w-24 mt-1" />
                    ) : (
                        <div className="flex items-end justify-between gap-2">
                            <p className="text-2xl md:text-3xl font-black text-[#111111] tracking-tight">{value}</p>

                            {/* Sparkline SVG */}
                            {data && data.length > 0 && (
                                <svg width="60" height="30" className={`stroke-current opacity-50 group-hover:opacity-100 transition-opacity ${color === 'green' ? 'text-green-500' : color === 'blue' ? 'text-blue-500' : color === 'purple' ? 'text-purple-500' : 'text-orange-500'}`} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d={`M0 ${30 - (data[0] / 100) * 30} L10 ${30 - (data[1] / 100) * 30} L20 ${30 - (data[2] / 100) * 30} L30 ${30 - (data[3] / 100) * 30} L40 ${30 - (data[4] / 100) * 30} L50 ${30 - (data[5] / 100) * 30} L60 ${30 - (data[6] / 100) * 30}`} />
                                </svg>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Active Indicator */}
            {isActive && (
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-current rounded-t-full shadow-[0_-2px_10px_rgba(0,0,0,0.5)] ${color === 'green' ? 'text-green-500' : color === 'blue' ? 'text-blue-500' : color === 'purple' ? 'text-purple-500' : 'text-orange-500'}`} />
            )}
        </button>
    );
};
