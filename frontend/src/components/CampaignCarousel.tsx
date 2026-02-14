import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { campaignService } from '../services/campaign.service';
import type { Campaign } from '../services/campaign.service';

export const CampaignCarousel = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [loading, setLoading] = useState(true);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const loadCampaigns = async () => {
            try {
                const data = await campaignService.getPublic();
                setCampaigns(data);
            } catch (error) {
                console.error('Failed to load campaigns', error);
            } finally {
                setLoading(false);
            }
        };
        loadCampaigns();
    }, []);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === campaigns.length - 1 ? 0 : prevIndex + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? campaigns.length - 1 : prevIndex - 1));
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    useEffect(() => {
        // Reset index if campaigns change (e.g. only 1 now)
        if (currentIndex >= campaigns.length && campaigns.length > 0) {
            setCurrentIndex(0);
        }
    }, [campaigns, currentIndex]);

    useEffect(() => {
        if (!isPaused && campaigns.length > 1) {
            timeoutRef.current = setTimeout(() => {
                nextSlide();
            }, 5000);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [currentIndex, isPaused, campaigns.length]);

    if (loading) {
        return (
            <div className="w-full h-[500px] flex items-center justify-center bg-dark-surface rounded-2xl shadow-2xl border border-white/5">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    if (campaigns.length === 0) {
        return null;
    }

    return (
        <div
            className="relative w-full h-[450px] md:h-[550px] overflow-hidden rounded-2xl shadow-2xl group border border-white/5"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Slides */}
            <div
                className="flex transition-transform duration-700 ease-out h-full"
                style={{ transform: `translateX(-${currentIndex * (100 / campaigns.length)}%)`, width: `${campaigns.length * 100}%` }}
            >
                {campaigns.map((campaign) => (
                    <div key={campaign.id} className="w-full h-full flex-shrink-0 relative" style={{ width: `${100 / campaigns.length}%` }}>
                        {/* Background Image with Overlay */}
                        <div className="absolute inset-0">
                            <img
                                src={campaign.imageUrl}
                                alt={campaign.title}
                                className="w-full h-full object-cover object-center"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col justify-center px-12 md:px-24 max-w-3xl relative z-30">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in-up">
                                {campaign.title}
                            </h2>
                            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl animate-fade-in-up delay-100">
                                {campaign.description}
                            </p>
                            {/* CTA Removed */}
                        </div>

                        {/* Edit Button (Visible if admin?) - Optional, not implemented yet */}
                    </div>
                ))}
            </div>

            {/* Navigation Buttons (visible only if multiple slides) */}
            {campaigns.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-4 group-hover:translate-x-0"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>
                </>
            )}

            {/* Indicators */}
            {campaigns.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                    {campaigns.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex
                                ? 'bg-white w-8'
                                : 'bg-white/50 hover:bg-white/80'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
