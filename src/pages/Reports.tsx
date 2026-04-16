import React, { useState, useEffect } from 'react';
import { Printer, ArrowUpRight, ArrowDownLeft, DollarSign, Users, Share2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

import { api } from '../lib/api';
import type { BoxTransaction, User } from '../types';
import { cn } from '../utils/cn';

type ReportType = 'OUTGOING' | 'RETURNS' | 'TOTALS';

export const ReportsPage: React.FC = () => {
    const [reportType, setReportType] = useState<ReportType>('TOTALS');
    const [transactions, setTransactions] = useState<BoxTransaction[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startUserCode, setStartUserCode] = useState('');
    const [endUserCode, setEndUserCode] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [txData, usersData] = await Promise.all([
                    api.get<any[]>('/transactions.php'),
                    api.get<any[]>('/users.php')
                ]);

                setTransactions(txData.map(tx => ({
                    id: tx.id.toString(),
                    userCode: tx.user_code,
                    userName: tx.user_name,
                    colorCode: tx.color_code,
                    colorName: tx.color_name,
                    quantity: tx.quantity,
                    type: tx.type,
                    timestamp: new Date(tx.created_at).getTime()
                })));

                setUsers(usersData.map(u => ({ id: u.id.toString(), name: u.name, shortCode: u.short_code })));
            } catch (err) {
                console.error("Error loading reports data", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    let filteredTx = transactions;
    if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        filteredTx = filteredTx.filter(tx => tx.timestamp >= start);
    }
    if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        filteredTx = filteredTx.filter(tx => tx.timestamp <= end);
    }

    let filteredUsers = users;
    if (startUserCode) {
        const start = startUserCode.toUpperCase();
        filteredTx = filteredTx.filter(tx => tx.userCode.localeCompare(start, undefined, { numeric: true, sensitivity: 'base' }) >= 0);
        filteredUsers = filteredUsers.filter(u => u.shortCode.localeCompare(start, undefined, { numeric: true, sensitivity: 'base' }) >= 0);
    }
    if (endUserCode) {
        const end = endUserCode.toUpperCase();
        filteredTx = filteredTx.filter(tx => tx.userCode.localeCompare(end, undefined, { numeric: true, sensitivity: 'base' }) <= 0);
        filteredUsers = filteredUsers.filter(u => u.shortCode.localeCompare(end, undefined, { numeric: true, sensitivity: 'base' }) <= 0);
    }

    const outgoingTx = filteredTx.filter(tx => tx.type === 'OUTGOING');
    const returnTx = filteredTx.filter(tx => tx.type === 'RETURN');

    // Totals calculated per user
    const userTotals = filteredUsers.map(user => {
        const userOut = outgoingTx.filter(tx => tx.userCode === user.shortCode).reduce((sum, tx) => sum + tx.quantity, 0);
        const userRet = returnTx.filter(tx => tx.userCode === user.shortCode).reduce((sum, tx) => sum + tx.quantity, 0);
        const balance = userOut - userRet;
        return {
            ...user,
            out: userOut,
            ret: userRet,
            balance: balance
        };
    }).filter(u => u.out > 0 || u.ret > 0); // Only show users with activity

    // Generate individual full statements for BATCH_STATEMENTS
    const userStatements = filteredUsers.map(user => {
        const uOut = outgoingTx.filter(tx => tx.userCode === user.shortCode);
        const uRet = returnTx.filter(tx => tx.userCode === user.shortCode);
        
        if (uOut.length === 0 && uRet.length === 0) return null;

        const colorsMap = new Map<string, { name: string, out: number, ret: number, bal: number }>();
        uOut.forEach(tx => {
            if (!colorsMap.has(tx.colorCode)) colorsMap.set(tx.colorCode, { name: tx.colorName, out: 0, ret: 0, bal: 0 });
            const data = colorsMap.get(tx.colorCode)!;
            data.out += tx.quantity; data.bal += tx.quantity;
        });
        uRet.forEach(tx => {
            if (!colorsMap.has(tx.colorCode)) colorsMap.set(tx.colorCode, { name: tx.colorName, out: 0, ret: 0, bal: 0 });
            const data = colorsMap.get(tx.colorCode)!;
            data.ret += tx.quantity; data.bal -= tx.quantity;
        });

        return {
            user,
            stats: Array.from(colorsMap.values()),
            transactions: [...uOut, ...uRet].sort((a, b) => b.timestamp - a.timestamp)
        };
    }).filter((u): u is NonNullable<typeof u> => u !== null);

    const overallBalance = userTotals.reduce((sum, u) => sum + u.balance, 0);

    const handlePrint = () => {
        window.print();
    };

    const handleShareUserPdf = async (u: any) => {
        const elementId = `user-report-batch-${u.user.id}`;
        const element = document.getElementById(elementId);
        if (!element) return;

        try {
            // Temporarily hide the share button from the capture
            const shareBtn = element.querySelector('.share-btn') as HTMLElement;
            if (shareBtn) shareBtn.style.display = 'none';

            const dataUrl = await toPng(element, { 
                pixelRatio: 2, 
                backgroundColor: '#ffffff',
                style: {
                    transform: 'none',
                    margin: '0'
                }
            });
            
            if (shareBtn) shareBtn.style.display = 'flex';

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // A4 dimensions
            const pdfWidth = 210;
            const imgProps = pdf.getImageProperties(dataUrl);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, 'PNG', 0, 10, pdfWidth, imgHeight);
            const pdfBlob = pdf.output('blob');

            const fileName = `كشف_حساب_${u.user.name.replace(/\\s+/g, '_')}.pdf`;
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

            const shareData = {
                files: [file],
                title: `كشف حساب - ${u.user.name}`,
                text: `مرفق كشف حساب وتفاصيل المخالات للمستخدم: ${u.user.name}`
            };

            // Wait briefly to allow UI to update if needed
            await new Promise(r => setTimeout(r, 100));

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share(shareData);
            } else {
                // Fallback for desktop where native share with files might not work
                // 1. Download the PDF
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // 2. Open WhatsApp Web to let user attach the downloaded file
                alert("تم تحميل ملف الـ PDF. سيتم الآن فتح واتساب، يرجى إرفاق الملف المحمل وإرساله للمستخدم.");
                let text = `مرحباً ${u.user.name}، مرفق كشف حسابك التفصيلي للمخالات والأرصدة.`;
                const encodedText = encodeURIComponent(text);
                window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
            }

        } catch (error) {
            console.error("Error generating PDF", error);
            alert("حدث خطأ أثناء إنشاء ملف الـ PDF.");
        }
    };

    return (
        <div className="flex flex-col gap-6 sm:gap-8 print:block">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        color: black !important;
                        overflow: visible !important;
                        display: block !important;
                    }
                    .hide-on-print { display: none !important; }
                    .text-brand-primary { color: #000 !important; }
                    .border-brand-border { border-color: #ddd !important; }
                    .print-break { page-break-after: always; break-after: page; display: block; border-bottom: none !important; }
                    .print-break:last-child { page-break-after: auto; break-after: auto; }
                    @page { margin: 1cm; }
                }
            `}} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hide-on-print">
                <div className="px-1 sm:px-0">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">التقارير الشاملة</h2>
                    <p className="text-gray-400 text-sm sm:text-base">تصدير وطباعة تقارير المخالات والأرصدة.</p>
                </div>
                
                <button onClick={handlePrint} className="premium-gradient w-full sm:w-auto px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform cursor-pointer">
                    <Printer size={20} /> حفظ كـ PDF / طباعة
                </button>
            </div>

            <div className="glass-card p-4 sm:p-6 hide-on-print">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-black/20 p-4 rounded-xl">
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <button 
                            onClick={() => setReportType('TOTALS')}
                            className={cn("px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors flex-1 md:flex-none justify-center", reportType === 'TOTALS' ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 hover:text-white")}
                        >
                            <DollarSign size={16} /> الرصيد الإجمالي ومفصل الكشوفات
                        </button>
                        <button 
                            onClick={() => setReportType('OUTGOING')}
                            className={cn("px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors flex-1 md:flex-none justify-center", reportType === 'OUTGOING' ? "bg-brand-primary text-white" : "bg-white/5 text-gray-400 hover:text-white")}
                        >
                            <ArrowUpRight size={16} /> سحب المخالات
                        </button>
                        <button 
                            onClick={() => setReportType('RETURNS')}
                            className={cn("px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors flex-1 md:flex-none justify-center", reportType === 'RETURNS' ? "bg-blue-500 text-white" : "bg-white/5 text-gray-400 hover:text-white")}
                        >
                            <ArrowDownLeft size={16} /> المرتجعات
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10 w-full md:w-auto">
                                <label className="text-sm text-gray-400 w-8">من:</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm text-white w-full"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10 w-full md:w-auto">
                                <label className="text-sm text-gray-400 w-8">إلى:</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm text-white w-full"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10 w-full md:w-auto">
                                <label className="text-sm text-gray-400 whitespace-nowrap">من الرمز:</label>
                                <input
                                    type="text"
                                    placeholder="مثال: C1"
                                    value={startUserCode}
                                    onChange={(e) => setStartUserCode(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm text-white w-full md:w-20 uppercase placeholder:text-gray-600"
                                    dir="ltr"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10 w-full md:w-auto">
                                <label className="text-sm text-gray-400 whitespace-nowrap">إلى الرمز:</label>
                                <input
                                    type="text"
                                    placeholder="مثال: C80"
                                    value={endUserCode}
                                    onChange={(e) => setEndUserCode(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm text-white w-full md:w-20 uppercase placeholder:text-gray-600"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Printable Area below */}
            <div className="glass-card overflow-hidden print-area bg-brand-surface print:bg-white print:border-none print:shadow-none min-h-[500px] print:min-h-0 print:overflow-visible">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full py-20 min-h-[300px]">
                        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="p-6 print:p-0 print:block">
                        <div className="text-center mb-8 border-b border-brand-border print:border-gray-300 pb-6 print:pb-4">
                            <h1 className="text-3xl font-bold mb-2">
                                {reportType === 'TOTALS' && 'تقرير الرصيد الإجمالي'}
                                {reportType === 'OUTGOING' && 'تقرير سحب المخالات المسجلة'}
                                {reportType === 'RETURNS' && 'تقرير المرتجعات المسجلة'}
                            </h1>
                            <p className="text-gray-400 print:text-gray-600 font-medium">
                                الفترة: {startDate ? new Intl.DateTimeFormat('en-GB').format(new Date(startDate)) : 'بداية المدة'} 
                                {' '}إلى{' '} 
                                {endDate ? new Intl.DateTimeFormat('en-GB').format(new Date(endDate)) : 'نهاية المدة'}
                            </p>
                        </div>

                        {reportType === 'TOTALS' && (
                            <div className="block print:block">
                                <div className="mb-8 hide-on-print">
                                    <div className="bg-black/20 print:bg-gray-100 p-4 rounded-xl border border-white/5 print:border-gray-200 text-center max-w-sm mx-auto">
                                        <p className="text-sm font-bold text-gray-400 print:text-gray-600 mb-1">إجمالي المخالات غير المرتجعة للجميع</p>
                                        <p className="text-4xl font-bold text-purple-400 print:text-black" dir="ltr">{overallBalance}</p>
                                    </div>
                                </div>

                                {userStatements.length === 0 ? (
                                    <div className="text-center py-20 text-gray-500 font-bold">لا يوجد أرصدة لهذه الفترة.</div>
                                ) : (
                                    userStatements.map((u, index) => (
                                        <div key={u.user.id} id={`user-report-batch-${u.user.id}`} className="print-break print:mb-0 mb-16 border-b-4 border-brand-primary/20 print:border-none pb-8 pt-4 px-4 bg-brand-dark/20 sm:bg-transparent rounded-xl">
                                            <div className="flex justify-between items-end border-b-2 border-white/20 print:border-black pb-4 mb-6 relative">
                                                <div>
                                                    <h2 className="text-2xl font-bold print:text-black mb-1">كشف حساب مستخدم</h2>
                                                    <p className="font-bold text-brand-primary print:text-gray-800 text-lg">الاسم: {u.user.name} | الرمز: {u.user.shortCode}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="text-left font-bold text-sm text-gray-400 print:text-gray-700">
                                                        الفترة: {startDate ? new Intl.DateTimeFormat('en-GB').format(new Date(startDate)) : 'بداية المدة'} - {endDate ? new Intl.DateTimeFormat('en-GB').format(new Date(endDate)) : 'نهاية المدة'}
                                                    </div>
                                                    <button 
                                                        onClick={() => handleShareUserPdf(u)} 
                                                        className="share-btn hide-on-print bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors absolute sm:top-0 sm:left-0 -top-10 left-0 sm:static"
                                                        title="تصدير كـ PDF وإرسال"
                                                    >
                                                        <Share2 size={14} /> PDF إرسال كـ
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <table className="w-full text-right print:text-black">
                                                <thead>
                                                    <tr className="bg-white/5 print:bg-gray-100 text-sm border-b-2 border-brand-border">
                                                        <th className="px-4 py-3 font-medium">اللون</th>
                                                        <th className="px-4 py-3 font-medium text-brand-primary print:text-gray-700">إجمالي المسحوب</th>
                                                        <th className="px-4 py-3 font-medium text-blue-400 print:text-gray-700">إجمالي المرتجع</th>
                                                        <th className="px-4 py-3 font-medium text-green-500 print:text-black font-bold">الرصيد الإجمالي</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-brand-border print:divide-gray-300">
                                                    {u.stats.map((stat, i) => (
                                                        <tr key={i} className="hover:bg-white/5 print:hover:bg-transparent">
                                                            <td className="px-4 py-3 font-bold">{stat.name}</td>
                                                            <td className="px-4 py-3">{stat.out}</td>
                                                            <td className="px-4 py-3">{stat.ret}</td>
                                                            <td className="px-4 py-3 font-bold" dir="ltr">{stat.bal}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            {u.transactions.length > 0 && (
                                                <div className="mt-6">
                                                    <h3 className="text-lg font-bold print:text-black mb-3">تفاصيل الحركات</h3>
                                                    <table className="w-full text-right print:text-black text-sm">
                                                        <thead>
                                                            <tr className="bg-white/5 print:bg-gray-100 border-b-2 border-brand-border">
                                                                <th className="px-3 py-2 font-medium">التاريخ والوقت</th>
                                                                <th className="px-3 py-2 font-medium">النوع</th>
                                                                <th className="px-3 py-2 font-medium">اللون</th>
                                                                <th className="px-3 py-2 font-medium">الكمية</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-brand-border print:divide-gray-300">
                                                            {u.transactions.map((tx) => (
                                                                <tr key={tx.id} className="hover:bg-white/5 print:hover:bg-transparent">
                                                                    <td className="px-3 py-2 font-mono tracking-wide" dir="ltr" style={{textAlign: 'right'}}>
                                                                        {new Intl.DateTimeFormat('en-GB', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(tx.timestamp))}
                                                                    </td>
                                                                    <td className={cn("px-3 py-2 font-bold", tx.type === 'OUTGOING' ? "text-brand-primary print:text-black" : "text-blue-400 print:text-gray-700")}>
                                                                        {tx.type === 'OUTGOING' ? 'سحب' : 'مرتجع'}
                                                                    </td>
                                                                    <td className="px-3 py-2">{tx.colorName}</td>
                                                                    <td className={cn("px-3 py-2 font-bold", tx.type === 'OUTGOING' ? "text-brand-primary print:text-black" : "text-blue-400 print:text-black")}>
                                                                        {tx.type === 'OUTGOING' ? '+' : '-'}{tx.quantity}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            <div className="mt-8 text-center text-xs text-brand-primary font-bold hidden print:block pt-4 border-t border-gray-300">
                                                طبع بواسطة نظام أرديس لإدارة المخالات | تاريخ الطباعة: {new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date())}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {reportType === 'OUTGOING' && (
                            <div className="block print:block">
                                {outgoingTx.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 font-bold">لا يوجد مسحوبات في هذه الفترة</div>
                                ) : (
                                    filteredUsers.filter(u => outgoingTx.some(tx => tx.userCode === u.shortCode)).map(user => {
                                        const userTx = outgoingTx.filter(tx => tx.userCode === user.shortCode);
                                        return (
                                            <div key={user.id} className="print-break print:mb-0 mb-12 border-b-2 border-brand-primary/20 print:border-none pb-6 pt-2">
                                                <div className="flex justify-between items-end border-b-2 border-brand-border print:border-black pb-3 mb-4">
                                                    <div>
                                                        <h2 className="text-xl font-bold print:text-black mb-1">تقرير سحب مخالات</h2>
                                                        <p className="font-bold text-brand-primary print:text-gray-800 text-sm">الاسم: {user.name} | الرمز: {user.shortCode}</p>
                                                    </div>
                                                </div>
                                                <table className="w-full text-right print:text-black text-sm">
                                                    <thead className="bg-white/5 print:bg-gray-100 border-b-2 border-brand-border">
                                                        <tr>
                                                            <th className="px-3 py-2 font-medium">التاريخ والوقت</th>
                                                            <th className="px-3 py-2 font-medium">اللون</th>
                                                            <th className="px-3 py-2 font-medium text-brand-primary print:text-gray-700">الكمية المسحوبة</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-brand-border print:divide-gray-300">
                                                        {userTx.map((tx) => (
                                                            <tr key={tx.id} className="hover:bg-white/5 print:hover:bg-transparent">
                                                                <td className="px-3 py-2 font-mono tracking-wide" dir="ltr" style={{textAlign: 'right'}}>{new Intl.DateTimeFormat('en-GB', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(tx.timestamp))}</td>
                                                                <td className="px-3 py-2">{tx.colorName}</td>
                                                                <td className="px-3 py-2 font-bold text-brand-primary print:text-black">+{tx.quantity}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {reportType === 'RETURNS' && (
                            <div className="block print:block">
                                {returnTx.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 font-bold">لا يوجد مرتجعات في هذه الفترة</div>
                                ) : (
                                    filteredUsers.filter(u => returnTx.some(tx => tx.userCode === u.shortCode)).map(user => {
                                        const userTx = returnTx.filter(tx => tx.userCode === user.shortCode);
                                        return (
                                            <div key={user.id} className="print-break print:mb-0 mb-12 border-b-2 border-brand-primary/20 print:border-none pb-6 pt-2">
                                                <div className="flex justify-between items-end border-b-2 border-brand-border print:border-black pb-3 mb-4">
                                                    <div>
                                                        <h2 className="text-xl font-bold print:text-black mb-1">تقرير مرتجعات مخالات</h2>
                                                        <p className="font-bold text-blue-400 print:text-gray-800 text-sm">الاسم: {user.name} | الرمز: {user.shortCode}</p>
                                                    </div>
                                                </div>
                                                <table className="w-full text-right print:text-black text-sm">
                                                    <thead className="bg-white/5 print:bg-gray-100 border-b-2 border-brand-border">
                                                        <tr>
                                                            <th className="px-3 py-2 font-medium">التاريخ والوقت</th>
                                                            <th className="px-3 py-2 font-medium">اللون</th>
                                                            <th className="px-3 py-2 font-medium text-blue-400 print:text-gray-700">الكمية المستردة</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-brand-border print:divide-gray-300">
                                                        {userTx.map((tx) => (
                                                            <tr key={tx.id} className="hover:bg-white/5 print:hover:bg-transparent">
                                                                <td className="px-3 py-2 font-mono tracking-wide" dir="ltr" style={{textAlign: 'right'}}>{new Intl.DateTimeFormat('en-GB', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(tx.timestamp))}</td>
                                                                <td className="px-3 py-2">{tx.colorName}</td>
                                                                <td className="px-3 py-2 font-bold text-blue-400 print:text-black">+{tx.quantity}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}



                        <div className="mt-12 text-center text-xs text-gray-500 hidden print:block pt-4 border-t border-gray-200">
                            طُبع من نظام أرديس لإدارة المخالات الذكي | تاريخ الطباعة: {new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date())}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
