"use client";
import React, { useState } from 'react';
import { Check, Copy, Key, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { BrandLogo } from '../ui/BrandLogo';
import type { Booking } from '../../services/types';

interface BookingRowProps {
    booking: Booking;
    onView: (b: Booking) => void;
    onAction: (action: 'cancel' | 'start' | 'complete', id: string) => void;
    isHighlighted?: boolean;
}

export const BookingRow = React.memo(({
    booking,
    onView,
    onAction,
    isHighlighted
}: BookingRowProps) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const { addToast } = useToast();

    const handleCopyCode = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        addToast('Kod kopyalandi', 'success');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const name = booking.customerName || '';
    const surname = booking.customerSurname || '';
    const initials = ((name.charAt(0) || '') + (surname.charAt(0) || '')).toUpperCase() || '?';
    const days = Math.ceil((new Date(booking.dropoffDate).getTime() - new Date(booking.pickupDate).getTime()) / (1000 * 60 * 60 * 24));

    return (
        <tr className={`transition-all group border-b border-white/5 last:border-0 ${isHighlighted
            ? 'bg-primary-500/10 hover:bg-primary-500/20'
            : 'hover:bg-black/5'
            }`}>
            <td className="p-4 text-center">
                <button
                    onClick={() => handleCopyCode(booking.bookingCode, booking.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/5 border border-black/10 hover:border-primary-500/50 hover:bg-primary-500/10 transition-all group/btn"
                    title="Kodu Kopyala"
                >
                    <span className="font-mono font-bold text-primary-500">{booking.bookingCode}</span>
                    {copiedId === booking.id ? (
                        <Check className="w-3 h-3 text-green-500" />
                    ) : (
                        <Copy className="w-3 h-3 text-gray-600 group-hover/btn:text-primary-400 opacity-0 group-hover/btn:opacity-100 transition-all" />
                    )}
                </button>
            </td>
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {initials}
                    </div>
                    <div>
                        <div className="font-medium text-[#111111] truncate max-w-[150px]" title={`${name} ${surname}`}>{name} {surname}</div>
                        <div className="text-xs text-gray-600 truncate max-w-[150px]" title={booking.customerPhone}>{booking.customerPhone}</div>
                        <div className="text-[10px] text-gray-700 truncate max-w-[150px]" title={booking.customerEmail}>{booking.customerEmail}</div>
                    </div>
                </div>
            </td>
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <BrandLogo
                        name={booking.car?.brand || ''}
                        url={booking.car?.brandLogo}
                        className="w-8 h-8"
                    />
                    <div>
                        <div className="font-medium text-[#111111] truncate max-w-[150px]" title={`${booking.car?.brand} ${booking.car?.model}`}>{booking.car?.brand} {booking.car?.model}</div>
                        <div className="text-xs text-gray-600">{booking.car?.plateNumber}</div>
                    </div>
                </div>
            </td>
            <td className="p-4 text-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center justify-center gap-2 text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span>{new Date(booking.pickupDate).toLocaleDateString('tr-TR').replace(/\./g, '/')}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            <span>{new Date(booking.dropoffDate).toLocaleDateString('tr-TR').replace(/\./g, '/')}</span>
                        </div>
                    </div>
                    <div className="text-xs font-medium text-gray-600 bg-black/5 px-2 py-1 rounded w-fit mx-auto border border-black/5">
                        {days} Gün
                    </div>
                </div>
            </td>
            <td className="p-4 text-center">
                <div className="flex flex-col items-center gap-1.5">
                    <div className="text-primary-500 font-bold whitespace-nowrap">{Number(booking.totalPrice).toLocaleString()} ₺</div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border w-fit ${booking.paymentStatus === 'PAID'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        } whitespace-nowrap`}>
                        <span className={`w-1 h-1 rounded-full ${booking.paymentStatus === 'PAID' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        {booking.paymentStatus === 'PAID' ? 'Ödendi' : 'Ödenmedi'}
                    </span>
                </div>
            </td>
            <td className="p-4 text-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${(booking.status === 'RESERVED' && booking.paymentStatus === 'UNPAID' && booking.expiresAt && new Date() > new Date(booking.expiresAt))
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    : booking.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : booking.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : booking.status === 'COMPLETED' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                : 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                    } whitespace-nowrap`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${(booking.status === 'RESERVED' && booking.paymentStatus === 'UNPAID' && booking.expiresAt && new Date() > new Date(booking.expiresAt))
                        ? 'bg-orange-500'
                        : booking.status === 'ACTIVE' ? 'bg-green-500'
                            : booking.status === 'CANCELLED' ? 'bg-red-500'
                                : booking.status === 'COMPLETED' ? 'bg-gray-500'
                                    : 'bg-primary-500'
                        }`} />
                    {(booking.status === 'RESERVED' && booking.paymentStatus === 'UNPAID' && booking.expiresAt && new Date() > new Date(booking.expiresAt))
                        ? 'Süre Doldu'
                        : booking.status === 'ACTIVE' ? 'Aktif'
                            : booking.status === 'CANCELLED' ? 'Iptal'
                                : booking.status === 'COMPLETED' ? 'Tamamlandi'
                                    : 'Rezerve'}
                </span>
            </td>
            <td className="p-4 text-center">
                <Button
                    size="sm"
                    variant="outline"
                    className="opacity-70 group-hover:opacity-100 transition-opacity text-xs px-3 py-1.5 border-black/10 text-[#111111] hover:bg-black/10 whitespace-nowrap mx-auto"
                    onClick={() => onView(booking)}
                >
                    Detaylar
                </Button>
            </td>
            <td className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                    {booking.status === 'RESERVED' && booking.paymentStatus === 'PAID' && (
                        (() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const pickup = new Date(booking.pickupDate);
                            pickup.setHours(0, 0, 0, 0);
                            const isArrived = today >= pickup;

                            if (isArrived) {
                                return (
                                    <Button
                                        size="sm"
                                        className="bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 hover:border-green-500/30 transition-all font-medium rounded-lg whitespace-nowrap"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAction('start', booking.id);
                                        }}
                                    >
                                        <Key className="w-4 h-4 mr-1.5" />
                                        Teslim Et
                                    </Button>
                                );
                            } else {
                                return (
                                    <span className="text-xs text-gray-600 italic px-2 py-1.5 border border-black/10 rounded-lg bg-black/5 select-none whitespace-nowrap">
                                        Teslim Bekleniyor
                                    </span>
                                );
                            }
                        })()
                    )}

                    {
                        booking.status === 'ACTIVE' && (
                            <Button
                                size="sm"
                                className="bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all font-medium rounded-lg whitespace-nowrap"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAction('complete', booking.id);
                                }}
                            >
                                <CheckCircle className="w-4 h-4 mr-1.5" />
                                Teslim Al
                            </Button>
                        )
                    }{booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                        <Button
                            size="sm"
                            className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all font-medium rounded-lg whitespace-nowrap"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAction('cancel', booking.id);
                            }}
                        >
                            Iptal
                        </Button>
                    )}
                </div>
            </td>
        </tr>
    );
});
