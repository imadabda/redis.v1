import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, CheckCircle, X } from 'lucide-react';
import { cn } from '../utils/cn';
import type { BoxTransaction, User, BoxColor } from '../types';
import { api } from '../lib/api';

export const ReturnsPage: React.FC = () => {
    const [transactions, setTransactions] = useState<BoxTransaction[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [colors, setColors] = useState<BoxColor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [txData, usersData, colorsData] = await Promise.all([
                    api.get<any[]>('/transactions.php'),
                    api.get<any[]>('/users.php'),
                    api.get<any[]>('/colors.php')
                ]);

                const mappedTx = txData
                    .filter(tx => tx.type === 'RETURN')
                    .map(tx => ({
                        id: tx.id.toString(),
                        userCode: tx.user_code,
                        userName: tx.user_name,
                        colorCode: tx.color_code,
                        colorName: tx.color_name,
                        quantity: tx.quantity,
                        timestamp: new Date(tx.created_at).getTime()
                    }));
                setTransactions(mappedTx);

                const mappedUsers = usersData.map(u => ({ id: u.id.toString(), name: u.name, shortCode: u.short_code }));
                setUsers(mappedUsers);

                const mappedColors = colorsData.map(c => ({ id: c.id.toString(), name: c.name, shortCode: c.short_code, hex: c.hex }));
                setColors(mappedColors);

                if (mappedColors.length > 0) {
                    setColorCode(mappedColors[0].shortCode);
                }
            } catch (err) {
                console.error("Error loading data", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const [userCode, setUserCode] = useState('');
    const [colorCode, setColorCode] = useState('');
    const [quantity, setQuantity] = useState('');
    const [customDate, setCustomDate] = useState('');
    const [showCustomDate, setShowCustomDate] = useState(false);

    const userCodeInputRef = useRef<HTMLInputElement>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        // Auto-focus on mount
        userCodeInputRef.current?.focus();
    }, []);

    // Live Validation
    const currentUser = users.find(u => u.shortCode.toUpperCase() === userCode.toUpperCase());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userCode || !colorCode || !quantity || !currentUser) return;

        const selectedColor = colors.find(c => c.shortCode === colorCode);
        if (!selectedColor) return;

        try {
            const data = await api.post<any>('/transactions.php', {
                user_code: currentUser.shortCode,
                user_name: currentUser.name,
                color_code: selectedColor.shortCode,
                color_name: selectedColor.name,
                quantity: parseInt(quantity, 10),
                type: 'RETURN',
                created_at: customDate || undefined
            });

            const newTransaction: BoxTransaction = {
                id: data.id.toString(),
                userCode: data.user_code,
                userName: data.user_name,
                colorCode: data.color_code,
                colorName: data.color_name,
                quantity: data.quantity,
                timestamp: new Date(data.created_at).getTime(),
            };

            setTransactions([newTransaction, ...transactions]);

            // Reset and show success
            setUserCode('');
            setQuantity('');
            setCustomDate('');
            setShowCustomDate(false);
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 2000);

            // Return focus to user code for continuous entry
            userCodeInputRef.current?.focus();

        } catch (err) {
            console.error("Error submitting return", err);
            alert("حدث خطأ أثناء تسجيل المرتجع");
        }
    };

    return (
        <div className="flex flex-col gap-8 relative">
            <AnimatePresence>
                {isSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-0 right-0 left-0 mx-auto w-fit z-50 bg-blue-500/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl backdrop-blur-md"
                    >
                        <CheckCircle size={20} /> تم تسجيل المرتجع بنجاح
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="px-1 sm:px-0">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-400">المرتجعات</h2>
                    <p className="text-gray-400 text-sm sm:text-base">تسجيل الصناديق المستردة من قبل المستخدمين.</p>
                </div>
                <div className="flex items-center gap-2 text-gray-400 bg-white/5 px-4 py-2 rounded-xl border border-white/5 w-fit sm:w-auto">
                    <Calendar size={18} />
                    <span className="text-sm font-medium">٢٨ فبراير، ٢٠٢٦</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Entry Form */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleSubmit} className="glass-card p-4 sm:p-6 flex flex-col gap-6 lg:sticky lg:top-10">
                        <h3 className="text-xl font-bold">إضافة مرتجع</h3>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-gray-500 font-bold uppercase mr-1">رمز المستخدم</label>
                                <input
                                    ref={userCodeInputRef}
                                    type="text"
                                    value={userCode}
                                    onChange={(e) => setUserCode(e.target.value)}
                                    placeholder="أدخل الرمز"
                                    required
                                    className={cn(
                                        "bg-black/20 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-transparent transition-all font-mono text-xl uppercase",
                                        currentUser ? "focus:ring-2 focus:ring-green-500/50 border-green-500/30" : (userCode ? "focus:ring-2 focus:ring-red-500/50 border-red-500/30" : "focus:ring-2 focus:ring-blue-500/50")
                                    )}
                                />
                                {userCode && (
                                    <div className="text-sm px-2 mt-1">
                                        {currentUser ? (
                                            <span className="text-green-500 font-bold flex items-center gap-1"><CheckCircle size={14} /> {currentUser.name}</span>
                                        ) : (
                                            <span className="text-red-500 font-bold flex items-center gap-1"><X size={14} /> مستخدم غير معروف</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-gray-500 font-bold uppercase mr-1">اللون / الرمز</label>
                                <select
                                    value={colorCode}
                                    onChange={(e) => setColorCode(e.target.value)}
                                    className="bg-black/20 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                >
                                    {colors.map(c => (
                                        <option key={c.shortCode} value={c.shortCode}>{c.name} ({c.shortCode})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-gray-500 font-bold uppercase mr-1">الكمية المستلمة</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="0"
                                    required
                                    min="1"
                                    className="bg-black/20 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-xl"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white transition-colors w-fit select-none">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-white/10 bg-black/20 text-blue-500 focus:ring-blue-500"
                                        checked={showCustomDate}
                                        onChange={(e) => {
                                            setShowCustomDate(e.target.checked);
                                            if (!e.target.checked) setCustomDate('');
                                        }}
                                    />
                                    <span className="text-sm font-bold">تسجيل بتاريخ مسبق</span>
                                </label>
                                
                                <AnimatePresence>
                                    {showCustomDate && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <input
                                                type="date"
                                                value={customDate}
                                                onChange={(e) => setCustomDate(e.target.value)}
                                                required={showCustomDate}
                                                className="bg-black/20 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-gray-300 w-full"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button type="submit" className="bg-blue-600 hover:bg-blue-500 w-full py-4 rounded-xl font-bold shadow-lg shadow-blue-900/20 mt-4 flex items-center justify-center gap-2 transition-colors cursor-pointer">
                                <Plus size={20} /> تسجيل المرتجع
                            </button>
                        </div>
                    </form>
                </div>

                {/* Recent Transactions List */}
                <div className="lg:col-span-2">
                    <div className="glass-card p-6 flex flex-col gap-6">
                        <h3 className="text-xl font-bold text-blue-400">المرتجعات الأخيرة</h3>

                        <div className="flex flex-col gap-1 px-1">
                            {isLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : transactions.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">لا توجد مرتجعات مسجلة</p>
                            ) : (
                                transactions.map((tx: BoxTransaction) => (
                                    <div key={tx.id} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 hover:bg-white/5 px-4 -mx-4 rounded-xl transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-mono font-bold text-sm">
                                                {tx.userCode}
                                            </div>
                                            <div>
                                                <p className="font-bold">{tx.userName}</p>
                                                <p className="text-xs text-gray-400 font-medium tracking-wide" dir="ltr" style={{textAlign: 'right'}}>
                                                    {new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(tx.timestamp))}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-left font-bold text-xl text-blue-400 flex flex-col items-end">
                                            + {tx.quantity} مخالة
                                            <p className="text-[10px] text-gray-500 uppercase tracking-tighter w-max">لون: {tx.colorName}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
