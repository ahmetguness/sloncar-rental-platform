import React from 'react';

export type DamageState = 'NONE' | 'PAINTED' | 'CHANGED';

export interface CarPart {
    id: string;
    name: string;
    path: string;
}

interface CarDamageMapProps {
    changedParts: string[];
    paintedParts: string[];
    onChange?: (partId: string, newState: DamageState) => void;
    readonly?: boolean;
}

const CAR_PARTS: CarPart[] = [
    // Column 1: Left Side
    { id: 'fender_fl', name: 'Sol Ön Çamurluk', path: 'M 100 110 L 190 110 L 190 180 L 100 180 Z' },
    { id: 'door_fl', name: 'Sol Ön Kapı', path: 'M 100 190 L 190 190 L 190 260 L 100 260 Z' },
    { id: 'door_rl', name: 'Sol Arka Kapı', path: 'M 100 270 L 190 270 L 190 340 L 100 340 Z' },
    { id: 'fender_rl', name: 'Sol Arka Çamurluk', path: 'M 100 350 L 190 350 L 190 420 L 100 420 Z' },

    // Column 2: Center (Front to Back)
    { id: 'bumper_f', name: 'Ön Tampon', path: 'M 200 50 L 390 50 L 390 90 L 200 90 Z' },
    { id: 'hood', name: 'Kaput', path: 'M 200 100 L 390 100 L 390 180 L 200 180 Z' },
    { id: 'roof', name: 'Tavan', path: 'M 200 190 L 390 190 L 390 340 L 200 340 Z' },
    { id: 'trunk', name: 'Bagaj', path: 'M 200 350 L 390 350 L 390 420 L 200 420 Z' },
    { id: 'bumper_r', name: 'Arka Tampon', path: 'M 200 430 L 390 430 L 390 470 L 200 470 Z' },

    // Column 3: Right Side
    { id: 'fender_fr', name: 'Sağ Ön Çamurluk', path: 'M 400 110 L 490 110 L 490 180 L 400 180 Z' },
    { id: 'door_fr', name: 'Sağ Ön Kapı', path: 'M 400 190 L 490 190 L 490 260 L 400 260 Z' },
    { id: 'door_rr', name: 'Sağ Arka Kapı', path: 'M 400 270 L 490 270 L 490 340 L 400 340 Z' },
    { id: 'fender_rr', name: 'Sağ Arka Çamurluk', path: 'M 400 350 L 490 350 L 490 420 L 400 420 Z' },
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

    const getPartStyles = (partName: string) => {
        const state = getPartState(partName);
        if (state === 'CHANGED') return { fill: '#ef4444', textFill: 'white', state };
        if (state === 'PAINTED') return { fill: '#fbbf24', textFill: 'black', state };
        return { fill: '#1f2937', textFill: '#9ca3af', state, opacity: 0.5 };
    };

    return (
        <div className="flex flex-col gap-6 p-6 bg-dark-bg/40 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group/map">
            {/* Header Legend */}
            <div className="flex justify-center gap-6 items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-gray-800 border border-white/10" />
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Orijinal</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-[#fbbf24] shadow-sm" />
                    <span className="text-sm font-bold text-[#fbbf24] uppercase tracking-widest">Boyalı</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-[#ef4444] shadow-sm" />
                    <span className="text-sm font-bold text-[#ef4444] uppercase tracking-widest">Değişen</span>
                </div>
            </div>

            <div className="relative w-full max-w-[500px] mx-auto scale-125 sm:scale-100 my-12 sm:my-4 px-2 sm:px-0">
                <svg viewBox="0 0 600 500" className="w-full h-full drop-shadow-lg">
                    {CAR_PARTS.map((part) => {
                        const styleInfo = getPartStyles(part.name);
                        const coords = part.path.match(/\d+/g)?.map(Number) || [0, 0, 0, 0];
                        const x = coords[0];
                        const y = coords[1];
                        const w = coords[2] - coords[0];
                        const h = coords[5] - coords[1];

                        return (
                            <g key={part.id} className="group/part" onClick={() => handlePartClick(part)}>
                                <rect
                                    x={x}
                                    y={y}
                                    width={w}
                                    height={h}
                                    rx="8"
                                    fill={styleInfo.fill}
                                    fillOpacity={styleInfo.opacity || 1}
                                    stroke={styleInfo.state === 'NONE' ? '#374151' : 'none'}
                                    strokeWidth="1.5"
                                    className={`transition-all duration-200 ${!readonly ? 'cursor-pointer hover:stroke-white hover:stroke-[2px] active:scale-[0.98]' : ''}`}
                                />
                                <text
                                    x={x + w / 2}
                                    y={y + h / 2}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={styleInfo.textFill}
                                    className="font-black uppercase pointer-events-none select-none tracking-tight"
                                    style={{ fontSize: '13px' }}
                                >
                                    {part.name.split(' ').map((word, i) => (
                                        <tspan x={x + w / 2} dy={i === 0 ? (part.name.includes(' ') ? -6 : 0) : 15} key={i}>{word}</tspan>
                                    ))}
                                </text>
                            </g>
                        );
                    })}

                    {/* Decorative Arrows for orientation */}
                    <g transform="translate(0, 5)">
                        <path d="M 300 5 L 290 15 M 300 5 L 310 15" stroke="#6b7280" strokeWidth="2" fill="none" />
                        <text x="300" y="30" textAnchor="middle" className="text-xs fill-gray-400 font-bold uppercase tracking-widest">Aracın Önü</text>
                    </g>
                </svg>
            </div>

            {!readonly && (
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-primary-400 uppercase tracking-widest border-t border-white/5 pt-4 -mx-6 -mb-6 py-3 bg-white/5">
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                    Düzenlemek İçin Parçaların Üzerine Tıklayın
                </div>
            )}
        </div>
    );
};
