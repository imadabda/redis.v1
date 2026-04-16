import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Check } from 'lucide-react';
import type { BoxColor } from '../types';
import { api } from '../lib/api';

export const ColorsPage: React.FC = () => {
    const [colors, setColors] = useState<BoxColor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchColors = async () => {
            try {
                const data = await api.get<any[]>('/colors.php');
                const mappedColors: BoxColor[] = data.map(c => ({
                    id: c.id,
                    name: c.name,
                    hex: c.hex,
                    shortCode: c.short_code
                }));
                setColors(mappedColors);
            } catch (error) {
                console.error('Error fetching colors:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchColors();
    }, []);

    const [isAddingMode, setIsAddingMode] = useState(false);
    const [newColorName, setNewColorName] = useState('');
    const [newColorHex, setNewColorHex] = useState('#ffffff');
    const [newColorShortCode, setNewColorShortCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا اللون؟')) return;

        try {
            await api.put(`/colors.php?id=${id}&action=disable`);
            setColors(colors.filter(color => color.id !== id));
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء الحذف');
        }
    };

    const handleAddColorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newColorName || !newColorShortCode || !newColorHex) return;

        setIsSubmitting(true);

        try {
            const data = await api.post<any>('/colors.php', {
                name: newColorName,
                hex: newColorHex,
                short_code: newColorShortCode.toUpperCase()
            });

            const newColor: BoxColor = {
                id: data.id,
                name: data.name,
                hex: data.hex,
                shortCode: data.short_code
            };
            setColors([...colors, newColor]);
            setIsAddingMode(false);
            setNewColorName('');
            setNewColorHex('#ffffff');
            setNewColorShortCode('');
        } catch (error) {
            console.error(error);
            alert('هذا الرمز مسجل مسبقاً أو حدث خطأ أثناء الإضافة.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="px-1 sm:px-0">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">ألوان الصناديق</h2>
                    <p className="text-gray-400 text-sm sm:text-base">تخصيص ألوان المخالات ومعانيها.</p>
                </div>
                {!isAddingMode && (
                    <button
                        onClick={() => setIsAddingMode(true)}
                        className="premium-gradient w-full sm:w-auto px-6 py-3 rounded-xl font-bold shadow-glow flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform cursor-pointer"
                    >
                        <Plus size={20} /> إضافة لون
                    </button>
                )}
            </div>

            {isAddingMode && (
                <form onSubmit={handleAddColorSubmit} className="glass-card p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-xl">إضافة لون جديد</h3>
                        <button type="button" onClick={() => setIsAddingMode(false)} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400">اسم اللون</label>
                            <input
                                type="text"
                                required
                                value={newColorName}
                                onChange={(e) => setNewColorName(e.target.value)}
                                disabled={isSubmitting}
                                placeholder="مثال: أحمر - مخالة كبيرة"
                                className="bg-black/20 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-transparent transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400">الرمز (Short Code)</label>
                            <input
                                type="text"
                                required
                                value={newColorShortCode}
                                onChange={(e) => setNewColorShortCode(e.target.value)}
                                disabled={isSubmitting}
                                placeholder="مثال: R1"
                                className="bg-black/20 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-transparent transition-all uppercase"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400">اللون (Hex)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={newColorHex}
                                    onChange={(e) => setNewColorHex(e.target.value)}
                                    disabled={isSubmitting}
                                    className="h-10 w-10 rounded cursor-pointer bg-transparent border-none p-0 disabled:opacity-50"
                                />
                                <span className="font-mono text-gray-300 uppercase">{newColorHex}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-brand-primary text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-opacity-90 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {isSubmitting ? 'جاري الحفظ...' : <><Check size={20} /> حفظ اللون</>}
                        </button>
                    </div>
                </form>
            )}

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {colors.map((color) => (
                        <div key={color.id} className="glass-card p-4 sm:p-6 flex flex-col gap-4 group">
                            <div className="flex justify-between items-start">
                                <div
                                    className="w-12 h-12 rounded-2xl shadow-lg transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: color.hex, boxShadow: `0 0 20px ${color.hex}44` }}
                                />
                                <button
                                    onClick={() => handleDelete(color.id)}
                                    className="text-gray-600 hover:text-red-500 transition-colors cursor-pointer p-2 -mr-2 -mt-2 rounded-lg hover:bg-white/5"
                                    title="حذف اللون"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <div>
                                <h3 className="font-bold text-xl">{color.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500 uppercase">الرمز:</span>
                                    <span className="text-xs font-mono font-bold text-gray-300">{color.shortCode}</span>
                                </div>
                            </div>

                            <div className="mt-2 pt-4 border-t border-brand-border flex justify-between items-center text-sm">
                                <span className="text-gray-400">الرصيد الحالي:</span>
                                <span className="font-bold">-</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
