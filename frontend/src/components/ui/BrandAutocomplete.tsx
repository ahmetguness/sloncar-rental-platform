import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Plus, Upload, X, Check, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { uploadService } from '../../services/api';

interface Brand {
    id: string;
    name: string;
    logoUrl: string;
}

interface BrandAutocompleteProps {
    brands: Brand[];
    value: string; // brand name
    logoUrl?: string;
    onChange: (brandName: string, logoUrl?: string) => void;
    label?: string;
    required?: boolean;
}

export const BrandAutocomplete = ({ brands, value, logoUrl, onChange, label = "Marka", required = false }: BrandAutocompleteProps) => {
    const [query, setQuery] = useState(value || '');
    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredBrands = useMemo(() => {
        if (!query) return brands;
        return brands.filter(b => b.name.toLowerCase().includes(query.toLowerCase()));
    }, [brands, query]);

    const exactMatch = useMemo(() => {
        return brands.find(b => b.name.toLowerCase() === query.toLowerCase());
    }, [brands, query]);

    // Keep query in sync with value prop when value changes externally
    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (brand: Brand) => {
        setQuery(brand.name);
        onChange(brand.name, brand.logoUrl);
        setIsOpen(false);
    };

    const handleCustomBrand = () => {
        onChange(query, logoUrl);
        setIsOpen(false);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadService.uploadImage(file);
            onChange(query, url);
        } catch (error) {
            console.error('Logo upload failed', error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            {label && (
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                    {label} {required && '*'}
                </label>
            )}

            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    <Search className="w-4 h-4" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        // Trigger immediate change for typing, but without logo if not matched
                        const match = brands.find(b => b.name.toLowerCase() === e.target.value.toLowerCase());
                        if (match) {
                            onChange(match.name, match.logoUrl);
                        } else {
                            // Only reset logo if we are typing something that is not matched
                            onChange(e.target.value, e.target.value === value ? logoUrl : undefined);
                        }
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Marka Ara veya Yaz..."
                    className="w-full pl-11 pr-4 py-3 bg-dark-bg border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-600 transition-all font-medium"
                    required={required}
                    autoComplete="off"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            onChange('', '');
                            setIsOpen(false);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-dark-surface-lighter border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredBrands.length > 0 ? (
                            filteredBrands.map((brand) => (
                                <button
                                    key={`${brand.id}-${brand.name}`}
                                    type="button"
                                    onClick={() => handleSelect(brand)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors group"
                                >
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1">
                                        <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain" />
                                    </div>
                                    <span className="text-white font-medium">{brand.name}</span>
                                    {exactMatch?.id === brand.id && (
                                        <Check className="w-4 h-4 text-primary-500 ml-auto" />
                                    )}
                                </button>
                            ))
                        ) : query ? (
                            <div className="px-4 py-3 text-gray-400 text-sm italic">
                                "{query}" markası bulunamadı. Yeni olarak ekleyebilirsiniz.
                            </div>
                        ) : null}
                    </div>

                    {query && !exactMatch && (
                        <div className="p-3 border-t border-white/5 bg-white/5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-xl bg-dark-bg border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {logoUrl ? (
                                            <img src={logoUrl} alt="New logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <Plus className="w-5 h-5 text-gray-600" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-white uppercase truncate">{query}</p>
                                        <p className="text-[10px] text-gray-500 font-medium font-mono">YENİ MARKA</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <label className="cursor-pointer">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            disabled={isUploading}
                                        />
                                        <div className={`p-2 rounded-lg bg-dark-bg border border-white/10 text-gray-400 hover:text-white hover:border-primary-500 transition-all flex items-center gap-2 text-xs font-bold ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-primary-500" /> : <Upload className="w-4 h-4" />}
                                            {logoUrl ? 'Değiştir' : 'Logo'}
                                        </div>
                                    </label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleCustomBrand}
                                        className="bg-primary-500 text-xs font-bold"
                                    >
                                        ONAYLA
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {query && (
                <div className="mt-2 flex items-center gap-3 p-2.5 bg-dark-bg/50 rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1 shadow-inner">
                        {logoUrl || exactMatch?.logoUrl ? (
                            <img src={logoUrl || exactMatch?.logoUrl} alt={query} className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-[10px] font-black text-dark-bg uppercase">
                                {query.substring(0, 2)}
                            </div>
                        )}
                    </div>
                    <div>
                        <span className="text-sm font-bold text-white uppercase block leading-none mb-1">{query}</span>
                        {exactMatch ? (
                            <span className="text-[10px] text-primary-500 font-bold uppercase tracking-tighter">Sistem Kayıtlı</span>
                        ) : (
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{logoUrl ? 'Özel Logo' : 'Logo Bekleniyor'}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
