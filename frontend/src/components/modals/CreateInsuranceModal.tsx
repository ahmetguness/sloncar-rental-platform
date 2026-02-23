import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatPhoneNumber, cleanPhoneNumber } from '../../utils/formatters';
import { Loader2, User, Phone, Briefcase, Car, Search, X } from 'lucide-react';
import type { UserInsurance } from '../../services/types';
import DatePicker, { registerLocale } from 'react-datepicker';
import { tr } from 'date-fns/locale/tr';
import "react-datepicker/dist/react-datepicker.css";

// Register Turkish locale
registerLocale('tr', tr);

interface CreateInsuranceModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const CreateInsuranceModal: React.FC<CreateInsuranceModalProps> = ({ onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<Partial<UserInsurance>>({
        month: new Date().toLocaleString('tr-TR', { month: 'long' }).toUpperCase(),
        startDate: new Date().toISOString().split('T')[0],
        branch: 'TRAFIK',
        amount: 0,
        company: '',
        policyNo: '',
        tcNo: '',
        fullName: ''
    });

    // Handle clicks outside suggestions to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchClients = async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setSearchLoading(true);
        try {
            const results = await adminService.searchClients(query);
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setSearchLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            const query = formData.fullName || formData.tcNo;
            if (query) searchClients(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [formData.fullName, formData.tcNo]);

    const handleSelectClient = (client: any) => {
        setFormData(prev => ({
            ...prev,
            fullName: client.fullName,
            tcNo: client.tcNo,
            // Keep existing values for other fields to allow manual entry/correction
            userId: client.userId || undefined
        }));
        setShowSuggestions(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToSubmit = {
                ...formData,
                startDate: new Date(formData.startDate as string).toISOString(),
                amount: Number(formData.amount)
            };
            await adminService.createInsurance(dataToSubmit);
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === 'phone' && typeof finalValue === 'string') {
            finalValue = formatPhoneNumber(cleanPhoneNumber(finalValue));
        }

        if (name === 'startDate') {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                const monthName = date.toLocaleString('tr-TR', { month: 'long' }).toUpperCase();
                setFormData(prev => ({
                    ...prev,
                    startDate: value,
                    month: monthName
                }));
                return;
            }
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Yeni Sigorta Ekle" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info with Autocomplete */}
                    <div className="col-span-2 relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-400 mb-1">İsim Soyisim</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="fullName"
                                        required
                                        autoComplete="off"
                                        className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 pl-10 text-white focus:ring-2 focus:ring-blue-500 transition-all"
                                        onChange={handleChange}
                                        value={formData.fullName || ''}
                                    />
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    {searchLoading && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">TC Kimlik No</label>
                                <input
                                    type="text"
                                    name="tcNo"
                                    required
                                    maxLength={11}
                                    autoComplete="off"
                                    className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500"
                                    onChange={handleChange}
                                    value={formData.tcNo || ''}
                                />
                            </div>
                        </div>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && (
                            <div
                                ref={suggestionsRef}
                                className="absolute z-50 w-full mt-2 bg-dark-bg border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                            >
                                <div className="p-2 border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 flex justify-between items-center">
                                    <span>Kayıtlı Müşteri Önerileri</span>
                                    <button onClick={() => setShowSuggestions(false)} className="hover:text-white transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    {suggestions.map((client) => (
                                        <button
                                            key={client.tcNo}
                                            type="button"
                                            className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 text-left group"
                                            onClick={() => handleSelectClient(client)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-sm">{client.fullName}</div>
                                                    <div className="text-[11px] text-gray-500 flex items-center gap-2">
                                                        <span>{client.tcNo}</span>
                                                        <span>•</span>
                                                        <span>{client.phone || 'Telefon Yok'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-blue-400 font-bold uppercase">{client.profession || 'Müşteri'}</div>
                                                <div className="text-[9px] text-gray-600 mt-0.5">{client.plate || 'Plaka Yok'}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Sigorta Şirketi</label>
                        <input type="text" name="company" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500" onChange={handleChange} value={formData.company || ''} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Poliçe No</label>
                        <input type="text" name="policyNo" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500" onChange={handleChange} value={formData.policyNo || ''} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Poliçe Ayı (Örn: OCAK)</label>
                        <input type="text" name="month" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white uppercase focus:ring-2 focus:ring-blue-500" onChange={handleChange} value={formData.month || ''} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Başlangıç Tarihi</label>
                        <DatePicker
                            selected={formData.startDate ? new Date(formData.startDate as string) : null}
                            onChange={(date: Date | null) => {
                                if (date) {
                                    const monthName = date.toLocaleString('tr-TR', { month: 'long' }).toUpperCase();
                                    setFormData(prev => ({
                                        ...prev,
                                        startDate: date.toISOString().split('T')[0],
                                        month: monthName
                                    }));
                                }
                            }}
                            dateFormat="dd/MM/yyyy"
                            locale="tr"
                            className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500"
                            placeholderText="Tarih Seçiniz"
                            autoComplete="off"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Branş</label>
                        <select name="branch" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500" onChange={handleChange} value={formData.branch}>
                            <option value="TRAFIK">Trafik</option>
                            <option value="KASKO">Kasko</option>
                            <option value="DASK">DASK</option>
                            <option value="KONUT">Konut</option>
                            <option value="SAGLIK">Sağlık</option>
                            <option value="DIGER">Diğer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Tutar (TL)</label>
                        <input type="number" name="amount" required step="0.01" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500" onChange={handleChange} value={formData.amount} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-2 p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5 text-gray-400"><Car className="w-4 h-4" /></div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase">Plaka</label>
                                <input type="text" name="plate" className="w-full bg-transparent border-none p-0 text-white focus:ring-0 placeholder:text-gray-700 h-6" placeholder="34 ABC 123" onChange={handleChange} value={formData.plate || ''} />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5 text-gray-400"><Phone className="w-4 h-4" /></div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase">Telefon</label>
                                <input type="text" name="phone" className="w-full bg-transparent border-none p-0 text-white focus:ring-0 placeholder:text-gray-700 h-6" placeholder="05xx xxx xxxx" onChange={handleChange} value={formData.phone || ''} />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5 text-gray-400"><Briefcase className="w-4 h-4" /></div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase">Meslek</label>
                                <input type="text" name="profession" className="w-full bg-transparent border-none p-0 text-white focus:ring-0 placeholder:text-gray-700 h-6" placeholder="Meslek Giriniz" onChange={handleChange} value={formData.profession || ''} />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5 text-gray-400"><Search className="w-4 h-4" /></div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase">Seri / Sıra No</label>
                                <input type="text" name="serialOrOrderNo" className="w-full bg-transparent border-none p-0 text-white focus:ring-0 placeholder:text-gray-700 h-6" placeholder="Poliçe Detayı" onChange={handleChange} value={formData.serialOrOrderNo || ''} />
                            </div>
                        </div>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Açıklama / Notlar</label>
                        <textarea name="description" rows={2} className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500" onChange={handleChange} value={formData.description || ''} />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10 gap-3">
                    <Button type="button" onClick={onClose} variant="outline" className="border-white/10 text-white hover:bg-white/10">
                        İptal
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kaydet'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateInsuranceModal;
