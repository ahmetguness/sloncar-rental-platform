import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { translateCategory } from '../../utils/translate';

interface ImageCarouselProps {
    images: string[];
    alt: string;
    category?: string;
    aspectRatio?: string;
}

export const ImageCarousel = ({
    images,
    alt,
    category,
    aspectRatio = "aspect-video"
}: ImageCarouselProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const nextSlide = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    if (!images || images.length === 0) {
        return (
            <div className={`relative rounded-2xl overflow-hidden ${aspectRatio} bg-dark-bg flex items-center justify-center text-gray-700`}>
                Görsel Yok
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div
                className={`relative ${aspectRatio} rounded-2xl overflow-hidden group/carousel bg-dark-bg shadow-2xl cursor-zoom-in`}
                onClick={() => setIsLightboxOpen(true)}
            >
                {/* Main Images */}
                <div
                    className="flex transition-transform duration-500 ease-out h-full"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {images.map((img, idx) => (
                        <img
                            key={idx}
                            src={img}
                            alt={`${alt} - ${idx + 1}`}
                            className="w-full h-full object-cover flex-shrink-0"
                        />
                    ))}
                </div>

                {/* Overlays & Badges */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-surface/60 via-transparent to-transparent pointer-events-none" />

                {category && (
                    <div className="absolute top-3 left-3 pointer-events-none">
                        <span className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-white uppercase tracking-wider">
                            {translateCategory(category as any)}
                        </span>
                    </div>
                )}

                <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-md p-2 rounded-lg border border-white/10 text-white/70 opacity-0 group-hover/carousel:opacity-100 transition-all">
                    <Maximize2 size={16} />
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prevSlide}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-primary-500"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-primary-500"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentIndex(idx);
                            }}
                            className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all duration-300 w-full ${idx === currentIndex
                                ? 'border-primary-500 scale-[1.03] shadow-lg shadow-primary-500/20'
                                : 'border-white/5 opacity-50 hover:opacity-100 hover:scale-[1.02]'
                                }`}
                        >
                            <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {/* Lightbox / Fullscreen Viewer */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    {/* Close Button */}
                    <button
                        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-red-500 transition-all z-[10000]"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <X size={24} />
                    </button>

                    {/* Main Fullscreen Image Container */}
                    <div
                        className="relative w-full max-w-5xl aspect-video flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={images[currentIndex]}
                            alt={`${alt} Fullscreen`}
                            className="w-full h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
                        />

                        {/* Navigation In Fullscreen */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prevSlide}
                                    className="absolute -left-12 lg:-left-20 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 text-white hover:bg-primary-500 transition-all"
                                >
                                    <ChevronLeft size={32} />
                                </button>
                                <button
                                    onClick={nextSlide}
                                    className="absolute -right-12 lg:-right-20 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 text-white hover:bg-primary-500 transition-all"
                                >
                                    <ChevronRight size={32} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Progress Indicator */}
                    <div className="absolute bottom-10 text-white/50 font-bold tracking-widest text-sm bg-white/5 px-6 py-2 rounded-full backdrop-blur-md">
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>
            )}
        </div>
    );
};
