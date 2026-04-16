import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Package,
    Clock,
    ArrowUpRight,
    ChevronLeft
} from 'lucide-react';
import { cn } from '../utils/cn';
import { api } from '../lib/api';
import type { BoxTransaction } from '../types';

const StatCard = ({ label, value, subtext, icon: Icon, trend, colorClass }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 sm:p-6 flex flex-col gap-4 relative overflow-hidden group"
    >
        <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 rounded-full -mr-16 -mt-16 transition-opacity group-hover:opacity-20", colorClass)} />

        <div className="flex justify-between items-start">
            <div className={cn("p-3 rounded-2xl bg-white/5 text-white/80", colorClass.replace('bg-', 'text-'))}>
                <Icon size={24} />
            </div>
            {trend && (
                <span className={cn("text-xs font-medium px-2 py-1 rounded-lg bg-green-500/10 text-green-500 flex items-center gap-1")}>
                    <TrendingUp size={12} /> {trend}
                </span>
            )}
        </div>

        <div>
            <p className="text-gray-400 text-sm font-medium">{label}</p>
            <h3 className="text-3xl font-bold mt-1">{value}</h3>
            {subtext && <p className="text-gray-500 text-xs mt-1">{subtext}</p>}
        </div>
    </motion.div>
);

export const Dashboard: React.FC = () => {
    const [transactions, setTransactions] = useState<BoxTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const txData = await api.get<any[]>('/transactions.php');

                const mappedTx = txData.map(tx => ({
                    id: tx.id.toString(),
                    userCode: tx.user_code,
                    userName: tx.user_name,
                    colorCode: tx.color_code,
                    colorName: tx.color_name,
                    quantity: tx.quantity,
                    type: tx.type,
                    timestamp: new Date(tx.created_at).getTime()
                }));
                setTransactions(mappedTx);
            } catch (err) {
                console.error("Error loading dashboard data", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    const recentTransactions = transactions.slice(0, 5);
    const totalOutgoing = transactions.filter(t => t.type === 'OUTGOING').reduce((acc, t) => acc + t.quantity, 0);
    const totalReturns = transactions.filter(t => t.type === 'RETURN').reduce((acc, t) => acc + t.quantity, 0);
    const balance = totalOutgoing - totalReturns;

    return (
        <div className="flex flex-col gap-8 sm:gap-10 mt-safe">
            {/* Header */}
            <div className="flex flex-col gap-1 px-1 sm:px-0">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">أهلاً بك، أرديس</h2>
                <p className="text-gray-400 text-sm sm:text-base">إليك نظرة سريعة على حركة المخالات اليوم.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="إجمالي المخالات الخارجة"
                    value={totalOutgoing}
                    subtext="إجمالي المسجل"
                    icon={ArrowUpRight}
                    colorClass="bg-brand-primary"
                />
                <StatCard
                    label="إجمالي المرتجعات"
                    value={totalReturns}
                    subtext="إجمالي المسجل"
                    icon={TrendingDown}
                    colorClass="bg-blue-500"
                />
                <StatCard
                    label="الرصيد المتبقي"
                    value={balance}
                    subtext="مخالة في السوق"
                    icon={Package}
                    colorClass="bg-purple-500"
                />
                <StatCard
                    label="المستخدمين النشطين"
                    value="-"
                    subtext="قيد التطوير"
                    icon={Clock}
                    colorClass="bg-amber-500"
                />
            </div>

            {/* Main Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">آخر النشاطات</h3>
                        <button className="text-brand-primary text-sm font-medium flex items-center gap-1 hover:underline">
                            عرض الكل <ChevronLeft size={16} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : recentTransactions.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">لا توجد أية نشاطات مسجلة</p>
                        ) : (
                            recentTransactions.map((tx) => (
                                <motion.div
                                    key={tx.id}
                                    whileHover={{ x: -4 }}
                                    className="glass-card p-4 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-gray-300 font-mono">
                                            {tx.userCode}
                                        </div>
                                        <div>
                                            <p className="font-bold">{tx.userName}</p>
                                            <p className="text-xs text-gray-400 font-medium tracking-wide" dir="ltr" style={{textAlign: 'right'}}>
                                                {new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(tx.timestamp))}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className={cn(
                                                "font-bold",
                                                (tx as any).type === 'OUTGOING' ? "text-brand-primary" : "text-blue-400"
                                            )}>
                                                {(tx as any).type === 'OUTGOING' ? '-' : '+'}{tx.quantity} مخالة
                                            </p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-tighter">
                                                لون: {tx.colorName}
                                            </p>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-gray-700 group-hover:bg-brand-primary transition-colors" />
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions / Color Summary */}
                <div className="glass-card p-6 flex flex-col gap-6 h-fit">
                    <h3 className="text-xl font-bold">توزيع الألوان</h3>
                    <div className="flex flex-col gap-4">
                        {[
                            { color: 'أحمر', count: 450, percent: 65, hex: '#ef4444' },
                            { color: 'أصفر', count: 180, percent: 25, hex: '#eab308' },
                            { color: 'أزرق', count: 70, percent: 10, hex: '#3b82f6' },
                        ].map((item) => (
                            <div key={item.color} className="flex flex-col gap-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">{item.color}</span>
                                    <span className="font-bold">{item.count}</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.percent}%` }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: item.hex }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="premium-gradient w-full py-3 rounded-xl font-bold shadow-glow mt-2 hover:scale-[1.02] transition-transform active:scale-100">
                        إضافة عملية جديدة
                    </button>
                </div>
            </div>
        </div>
    );
};
