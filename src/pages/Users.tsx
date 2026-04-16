import React, { useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Plus, User as UserIcon, Search, Trash2, X, Check, Printer, Share2 } from 'lucide-react';
import type { User, BoxTransaction as LocalTransaction } from '../types';
import { api } from '../lib/api';
import { cn } from '../utils/cn';

export const UserReportModal: React.FC<{ user: User, onClose: () => void }> = ({ user, onClose }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [userOutgoing, setUserOutgoing] = useState<LocalTransaction[]>([]);
    const [userReturns, setUserReturns] = useState<LocalTransaction[]>([]);
    const [isLoadingModal, setIsLoadingModal] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const txData = await api.get<any[]>('/transactions.php');

                const mappedOutgoing = txData
                    .filter(tx => tx.type === 'OUTGOING' && tx.user_code === user.shortCode)
                    .map(tx => ({
                        id: tx.id.toString(),
                        userCode: tx.user_code,
                        userName: tx.user_name,
                        colorCode: tx.color_code,
                        colorName: tx.color_name,
                        quantity: tx.quantity,
                        timestamp: new Date(tx.created_at).getTime(),
                        type: 'OUTGOING' as const
                    }));

                const mappedReturns = txData
                    .filter(tx => tx.type === 'RETURN' && tx.user_code === user.shortCode)
                    .map(tx => ({
                        id: tx.id.toString(),
                        userCode: tx.user_code,
                        userName: tx.user_name,
                        colorCode: tx.color_code,
                        colorName: tx.color_name,
                        quantity: tx.quantity,
                        timestamp: new Date(tx.created_at).getTime(),
                        type: 'RETURN' as const
                    }));

                setUserOutgoing(mappedOutgoing as LocalTransaction[]);
                setUserReturns(mappedReturns as LocalTransaction[]);
            } catch (err) {
                console.error("Error fetching user report data", err);
            } finally {
                setIsLoadingModal(false);
            }
        };
        fetchUserData();
    }, [user.shortCode]);

    let filteredOutgoing = userOutgoing;
    let filteredReturns = userReturns;

    if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        filteredOutgoing = filteredOutgoing.filter(tx => tx.timestamp >= start);
        filteredReturns = filteredReturns.filter(tx => tx.timestamp >= start);
    }
    if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        filteredOutgoing = filteredOutgoing.filter(tx => tx.timestamp <= end);
        filteredReturns = filteredReturns.filter(tx => tx.timestamp <= end);
    }

    const colorsMap = new Map<string, { name: string, out: number, ret: number, bal: number }>();

    filteredOutgoing.forEach(tx => {
        if (!colorsMap.has(tx.colorCode)) {
            colorsMap.set(tx.colorCode, { name: tx.colorName, out: 0, ret: 0, bal: 0 });
        }
        const data = colorsMap.get(tx.colorCode)!;
        data.out += tx.quantity;
        data.bal += tx.quantity;
    });

    filteredReturns.forEach(tx => {
        if (!colorsMap.has(tx.colorCode)) {
            colorsMap.set(tx.colorCode, { name: tx.colorName, out: 0, ret: 0, bal: 0 });
        }
        const data = colorsMap.get(tx.colorCode)!;
        data.ret += tx.quantity;
        data.bal -= tx.quantity;
    });

    const stats = Array.from(colorsMap.values());

    const handleShare = async () => {
        const element = document.getElementById('user-modal-content');
        if (!element) return;

        try {
            // Temporarily hide the action buttons from the capture
            const actionsDiv = element.querySelector('.print\\:hidden') as HTMLElement;
            if (actionsDiv) actionsDiv.style.display = 'none';

            const dataUrl = await toPng(element, { 
                pixelRatio: 2, 
                backgroundColor: '#ffffff',
                style: {
                    transform: 'none',
                    margin: '0'
                }
            });
            
            if (actionsDiv) actionsDiv.style.display = 'flex';

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = 210;
            const imgProps = pdf.getImageProperties(dataUrl);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, 'PNG', 0, 10, pdfWidth, imgHeight);
            const pdfBlob = pdf.output('blob');

            const fileName = `كشف_حساب_${user.name.replace(/\\s+/g, '_')}.pdf`;
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

            const shareData = {
                files: [file],
                title: `كشف حساب - ${user.name}`,
                text: `مرفق كشف حساب وتفاصيل المخالات للمستخدم: ${user.name}`
            };

            await new Promise(r => setTimeout(r, 100));

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share(shareData);
            } else {
                // Fallback for desktop where native share with files might not work
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                alert("تم تحميل ملف الـ PDF. سيتم الآن فتح واتساب، يرجى إرفاق الملف الذي تم تحميله وإرساله للمستخدم.");
                let text = `مرحباً ${user.name}، مرفق كشف حسابك التفصيلي للمخالات والأرصدة.`;
                const encodedText = encodeURIComponent(text);
                window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
            }

        } catch (error) {
            console.error("Error generating PDF", error);
            alert("حدث خطأ أثناء إنشاء ملف الـ PDF.");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-brand-dark/95 flex items-center justify-center p-2 sm:p-6 print:p-0 print:static print:bg-white print:z-0 overflow-hidden">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * { visibility: hidden; }
                    .print-section, .print-section * { visibility: visible; }
                    .print-section { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        color: black !important;
                    }
                    @page { margin: 1cm; }
                }
            `}} />
            <div id="user-modal-content" className="glass-card w-full max-w-2xl bg-brand-dark rounded-2xl shadow-2xl flex flex-col max-h-[95vh] print:shadow-none print:border-none print:bg-white print:text-black print:max-w-full print:h-auto print:max-h-none print:rounded-none print-section relative pb-4">
                <div className="p-6 border-b border-brand-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:border-b-2 print:border-black">
                    <div>
                        <h2 className="text-2xl font-bold">كشف حساب مستخدم</h2>
                        <p className="text-gray-400 print:text-gray-600">الاسم: {user.name} | الرمز: {user.shortCode}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 print:hidden">
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1 border border-white/10">
                            <label className="text-xs text-gray-400">من:</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm text-white"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1 border border-white/10">
                            <label className="text-xs text-gray-400">إلى:</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm text-white"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleShare} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors cursor-pointer" title="تصدير كـ PDF وإرسال">
                                <Share2 size={18} /> إرسال كـ PDF
                            </button>
                            <button onClick={() => window.print()} className="bg-brand-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-opacity-90 transition-colors cursor-pointer">
                                <Printer size={18} /> طباعة
                            </button>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 print:overflow-visible">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold print:text-black">ملخص العهد والأرصدة</h3>
                        <div className="hidden print:block text-sm font-bold text-gray-700">
                            الفترة: {startDate ? new Date(startDate).toLocaleDateString('ar-EG') : 'بداية المدة'} - {endDate ? new Date(endDate).toLocaleDateString('ar-EG') : 'نهاية المدة'}
                        </div>
                    </div>
                    {isLoadingModal ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : stats.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">لا توجد حركات مسجلة لهذا المستخدم</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right print:text-black">
                                <thead>
                                    <tr className="bg-white/5 print:bg-gray-100 text-sm">
                                        <th className="px-4 py-3 font-medium">اللون</th>
                                        <th className="px-4 py-3 font-medium text-brand-primary">إجمالي المسحوب</th>
                                        <th className="px-4 py-3 font-medium text-blue-400">إجمالي المرتجع</th>
                                        <th className="px-4 py-3 font-medium text-green-500">الرصيد الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border print:divide-gray-300">
                                    {stats.map((stat, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors print:hover:bg-transparent">
                                            <td className="px-4 py-3 font-bold">{stat.name}</td>
                                            <td className="px-4 py-3">{stat.out}</td>
                                            <td className="px-4 py-3">{stat.ret}</td>
                                            <td className="px-4 py-3 font-bold" dir="ltr">{stat.bal}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="mt-8 text-center text-sm text-gray-500 hidden print:block">
                        طبع بواسطة نظام أرديس لإدارة المخالات - {new Date().toLocaleDateString('ar-EG')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await api.get<any[]>('/users.php');
                const mappedUsers: User[] = data.map(u => ({
                    id: u.id,
                    name: u.name,
                    shortCode: u.short_code
                }));
                setUsers(mappedUsers);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const [isAddingMode, setIsAddingMode] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserShortCode, setNewUserShortCode] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [printingUser, setPrintingUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

        try {
            await api.put(`/users.php?id=${id}&action=disable`);
            setUsers(users.filter(user => user.id !== id));
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء الحذف');
        }
    };

    const handleAddUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserName || !newUserShortCode) return;

        setIsSubmitting(true);

        try {
            const data = await api.post<any>('/users.php', {
                name: newUserName,
                short_code: newUserShortCode.toUpperCase()
            });

            const newUser: User = {
                id: data.id,
                name: data.name,
                shortCode: data.short_code
            };
            setUsers([newUser, ...users]);
            setIsAddingMode(false);
            setNewUserName('');
            setNewUserShortCode('');
        } catch (error) {
            console.error(error);
            alert('هذا الرمز مسجل مسبقاً أو حدث خطأ أثناء الإضافة.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.includes(searchQuery) || user.shortCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="px-1 sm:px-0">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">المستخدمين</h2>
                    <p className="text-gray-400 text-sm sm:text-base">إدارة المستخدمين واختصاراتهم الخاصة.</p>
                </div>
                {!isAddingMode && (
                    <button
                        onClick={() => setIsAddingMode(true)}
                        className="premium-gradient w-full sm:w-auto px-6 py-3 rounded-xl font-bold shadow-glow flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform cursor-pointer"
                    >
                        <Plus size={20} /> إضافة مستخدم
                    </button>
                )}
            </div>

            {isAddingMode && (
                <form onSubmit={handleAddUserSubmit} className="glass-card p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-xl">إضافة مستخدم جديد</h3>
                        <button type="button" onClick={() => setIsAddingMode(false)} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400">اسم المستخدم</label>
                            <input
                                type="text"
                                required
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                disabled={isSubmitting}
                                className="bg-black/20 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-transparent transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-400">الرمز (Short Code)</label>
                            <input
                                type="text"
                                required
                                value={newUserShortCode}
                                onChange={(e) => setNewUserShortCode(e.target.value)}
                                disabled={isSubmitting}
                                className="bg-black/20 border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-transparent transition-all uppercase"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-brand-primary text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-opacity-90 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {isSubmitting ? 'جاري الحفظ...' : <><Check size={20} /> حفظ المستخدم</>}
                        </button>
                    </div>
                </form>
            )}

            <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                    <Search size={20} className="text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="بحث عن مستخدم أو رمز..."
                        className="bg-transparent border-none outline-none text-white w-full placeholder:text-gray-600"
                    />
                </div>

                <div className="overflow-x-auto min-h-[200px] relative">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-white/5 text-gray-400 text-sm">
                                    <th className="px-6 py-4 font-medium">الاسم</th>
                                    <th className="px-6 py-4 font-medium">الرمز الاختصاري</th>
                                    <th className="px-6 py-4 font-medium">العمليات</th>
                                    <th className="px-6 py-4 font-medium w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                                                    <UserIcon size={16} />
                                                </div>
                                                <span className="font-bold">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-brand-primary font-mono font-bold">
                                                {user.shortCode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">
                                            -
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setPrintingUser(user)}
                                                    className="text-gray-500 hover:text-brand-primary transition-colors cursor-pointer"
                                                    title="طباعة كشف الحساب"
                                                >
                                                    <Printer size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                                                    title="حذف المستخدم"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {printingUser && (
                <UserReportModal
                    user={printingUser}
                    onClose={() => setPrintingUser(null)}
                />
            )}
        </div>
    );
};
