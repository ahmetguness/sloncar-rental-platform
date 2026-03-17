import React from 'react';

export type DamageState = 'NONE' | 'PAINTED' | 'CHANGED';

export interface CarPart {
    id: string;
    name: string;
    path: string;
    labelX: number;
    labelY: number;
}

interface CarDamageMapProps {
    changedParts: string[];
    paintedParts: string[];
    onChange?: (partId: string, newState: DamageState) => void;
    readonly?: boolean;
}

// Top-down car view with realistic part shapes
// Viewbox: 0 0 340 600
const CAR_PARTS: CarPart[] = [
    // Front bumper - curved front
    {
        id: 'bumper_f', name: 'Ön Tampon',
        path: 'M 90 75 Q 90 45, 170 35 Q 250 45, 250 75 L 245 95 Q 170 88, 95 95 Z',
        labelX: 170, labelY: 65
    },
    // Hood - tapered trapezoid
    {
        id: 'hood', name: 'Kaput',
        path: 'M 95 95 Q 170 88, 245 95 L 250 200 Q 170 195, 90 200 Z',
        labelX: 170, labelY: 148
    },
    // Roof - wide rectangle with slight curves
    {
        id: 'roof', name: 'Tavan',
        path: 'M 85 270 Q 85 255, 90 245 L 90 200 Q 170 195, 250 200 L 250 245 Q 255 255, 255 270 L 255 370 Q 255 380, 250 390 L 90 390 Q 85 380, 85 370 Z',
        labelX: 170, labelY: 300
    },
    // Trunk - tapered back
    {
        id: 'trunk', name: 'Bagaj',
        path: 'M 90 390 L 250 390 L 248 480 Q 170 488, 92 480 Z',
        labelX: 170, labelY: 435
    },
    // Rear bumper - curved back
    {
        id: 'bumper_r', name: 'Arka Tampon',
        path: 'M 92 480 Q 170 488, 248 480 L 250 505 Q 250 535, 170 545 Q 90 535, 90 505 Z',
        labelX: 170, labelY: 515
    },
    // Front left fender - curved shape hugging the body
    {
        id: 'fender_fl', name: 'Sol Ön Çamurluk',
        path: 'M 90 95 L 95 95 L 90 200 L 55 205 Q 40 175, 40 150 Q 40 110, 90 95 Z',
        labelX: 58, labelY: 150
    },
    // Front left door
    {
        id: 'door_fl', name: 'Sol Ön Kapı',
        path: 'M 90 200 L 55 205 Q 48 230, 45 260 L 45 310 L 85 310 L 85 270 Q 85 255, 90 245 L 90 200 Z',
        labelX: 58, labelY: 258
    },
    // Rear left door
    {
        id: 'door_rl', name: 'Sol Arka Kapı',
        path: 'M 85 310 L 45 310 L 45 370 Q 48 400, 55 415 L 90 390 Q 85 380, 85 370 Z',
        labelX: 58, labelY: 358
    },
    // Rear left fender
    {
        id: 'fender_rl', name: 'Sol Arka Çamurluk',
        path: 'M 55 415 Q 40 440, 40 460 Q 40 490, 90 505 L 92 480 Q 90 460, 90 390 L 55 415 Z',
        labelX: 58, labelY: 455
    },
    // Front right fender
    {
        id: 'fender_fr', name: 'Sağ Ön Çamurluk',
        path: 'M 250 95 L 245 95 L 250 200 L 285 205 Q 300 175, 300 150 Q 300 110, 250 95 Z',
        labelX: 282, labelY: 150
    },
    // Front right door
    {
        id: 'door_fr', name: 'Sağ Ön Kapı',
        path: 'M 250 200 L 285 205 Q 292 230, 295 260 L 295 310 L 255 310 L 255 270 Q 255 255, 250 245 L 250 200 Z',
        labelX: 282, labelY: 258
    },
    // Rear right door
    {
        id: 'door_rr', name: 'Sağ Arka Kapı',
        path: 'M 255 310 L 295 310 L 295 370 Q 292 400, 285 415 L 250 390 Q 255 380, 255 370 Z',
        labelX: 282, labelY: 358
    },
    // Rear right fender
    {
        id: 'fender_rr', name: 'Sağ Arka Çamurluk',
        path: 'M 285 415 Q 300 440, 300 460 Q 300 490, 250 505 L 248 480 Q 250 460, 250 390 L 285 415 Z',
        labelX: 282, labelY: 455
    },
];

export const CarDamageMap: React.FC<CarDamageMapProps> = ({
    changedParts,
    paintedParts,
    onChange,
    readonly = false
}) => {
    const getPartState = (partName: string): DamageState => {
        const normalizedName = partName.toLowerCase().trim();
        if (changedParts.some(p => p.toLowerCase().trim() === normalizedName)) return 'CHANGED';
        if (paintedParts.some(p => p.toLowerCase().trim() === normalizedName)) return 'PAINTED';
        return 'NONE';
    };

    const handlePartClick = (part: CarPart) => {
        if (readonly || !onChange) return;
        const currentState = getPartState(part.name);
        let newState: DamageState = 'NONE';
        if (currentState === 'NONE') newState = 'PAINTED';
        else if (currentState === 'PAINTED') newState = 'CHANGED';
        else newState = 'NONE';
        onChange(part.name, newState);
    };

    const getPartFill = (partName: string) => {
        const state = getPartState(partName);
        if (state === 'CHANGED') return { fill: '#ef4444', stroke: '#dc2626', textFill: '#fff', opacity: 1 };
        if (state === 'PAINTED') return { fill: '#fbbf24', stroke: '#f59e0b', textFill: '#111', opacity: 1 };
        return { fill: '#e5e7eb', stroke: '#d1d5db', textFill: '#6b7280', opacity: 1 };
    };

    return (
        <div className="flex flex-col gap-4 p-4 sm:p-6 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] shadow-lg">
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 border-b border-[#E5E7EB] pb-4">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#e5e7eb] border border-[#d1d5db]" />
                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Orijinal</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#fbbf24] border border-[#f59e0b]" />
                    <span className="text-xs font-bold text-[#92400e] uppercase tracking-wider">Boyalı</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#ef4444] border border-[#dc2626]" />
                    <span className="text-xs font-bold text-[#dc2626] uppercase tracking-wider">Değişen</span>
                </div>
            </div>

            {/* SVG Car */}
            <div className="relative w-full max-w-[360px] mx-auto py-4">
                <svg viewBox="20 20 300 560" className="w-full h-auto">
                    {/* Car body outline shadow */}
                    <path
                        d="M 170 30 Q 255 40, 255 75 L 300 110 Q 305 150, 305 200 L 300 310 L 300 400 Q 305 450, 300 490 L 255 510 Q 255 545, 170 550 Q 85 545, 85 510 L 40 490 Q 35 450, 40 400 L 40 310 L 40 200 Q 35 150, 40 110 L 85 75 Q 85 40, 170 30 Z"
                        fill="none"
                        stroke="#d1d5db"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        opacity="0.5"
                    />

                    {/* Wheels */}
                    <ellipse cx="48" cy="160" rx="14" ry="28" fill="#374151" opacity="0.7" />
                    <ellipse cx="48" cy="160" rx="8" ry="18" fill="#1f2937" opacity="0.8" />
                    <ellipse cx="292" cy="160" rx="14" ry="28" fill="#374151" opacity="0.7" />
                    <ellipse cx="292" cy="160" rx="8" ry="18" fill="#1f2937" opacity="0.8" />
                    <ellipse cx="48" cy="450" rx="14" ry="28" fill="#374151" opacity="0.7" />
                    <ellipse cx="48" cy="450" rx="8" ry="18" fill="#1f2937" opacity="0.8" />
                    <ellipse cx="292" cy="450" rx="14" ry="28" fill="#374151" opacity="0.7" />
                    <ellipse cx="292" cy="450" rx="8" ry="18" fill="#1f2937" opacity="0.8" />

                    {/* Headlights */}
                    <ellipse cx="110" cy="58" rx="18" ry="8" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" opacity="0.6" />
                    <ellipse cx="230" cy="58" rx="18" ry="8" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1" opacity="0.6" />

                    {/* Taillights */}
                    <ellipse cx="110" cy="522" rx="16" ry="7" fill="#fca5a5" stroke="#f87171" strokeWidth="1" opacity="0.6" />
                    <ellipse cx="230" cy="522" rx="16" ry="7" fill="#fca5a5" stroke="#f87171" strokeWidth="1" opacity="0.6" />

                    {/* Clickable parts */}
                    {CAR_PARTS.map((part) => {
                        const style = getPartFill(part.name);
                        return (
                            <g key={part.id} onClick={() => handlePartClick(part)} className={!readonly ? 'cursor-pointer' : ''}>
                                <path
                                    d={part.path}
                                    fill={style.fill}
                                    fillOpacity={style.opacity}
                                    stroke={style.stroke}
                                    strokeWidth="1.5"
                                    strokeLinejoin="round"
                                    className={`transition-all duration-150 ${!readonly ? 'hover:brightness-110 hover:stroke-[2.5px] active:brightness-90' : ''}`}
                                />
                                <text
                                    x={part.labelX}
                                    y={part.labelY}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={style.textFill}
                                    className="pointer-events-none select-none font-bold uppercase"
                                    style={{ fontSize: '9px' }}
                                >
                                    {part.name.split(' ').map((word, i, arr) => (
                                        <tspan
                                            key={i}
                                            x={part.labelX}
                                            dy={i === 0 ? -(arr.length - 1) * 5.5 : 11}
                                        >
                                            {word}
                                        </tspan>
                                    ))}
                                </text>
                            </g>
                        );
                    })}

                    {/* Direction arrow */}
                    <g opacity="0.4">
                        <path d="M 170 18 L 164 26 M 170 18 L 176 26" stroke="#9ca3af" strokeWidth="1.5" fill="none" />
                        <text x="170" y="14" textAnchor="middle" fill="#9ca3af" style={{ fontSize: '7px' }} className="font-bold uppercase">ÖN</text>
                    </g>
                    <g opacity="0.4">
                        <path d="M 170 562 L 164 554 M 170 562 L 176 554" stroke="#9ca3af" strokeWidth="1.5" fill="none" />
                        <text x="170" y="572" textAnchor="middle" fill="#9ca3af" style={{ fontSize: '7px' }} className="font-bold uppercase">ARKA</text>
                    </g>
                </svg>
            </div>

            {!readonly && (
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-primary-500 uppercase tracking-widest border-t border-[#E5E7EB] pt-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                    Düzenlemek İçin Parçaların Üzerine Tıklayın
                </div>
            )}
        </div>
    );
};
