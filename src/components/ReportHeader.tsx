import React from 'react';
import { Phone } from 'lucide-react';

export const ReportHeader: React.FC = () => {
    return (
        <div className="report-header hidden print:flex print:flex-col items-center justify-center border-b-2 border-black/20 pb-4 mb-6">
            <h1 className="text-3xl font-extrabold text-black mb-2 tracking-tight">شركة الادريس لتجاره الخضار والفواكه</h1>
            <div className="flex items-center gap-6 text-black font-bold text-lg dir-ltr">
                <div className="flex items-center gap-2">
                    <span>0568726061</span>
                    <Phone size={18} />
                </div>
                <div className="flex items-center gap-2">
                    <span>0569979885</span>
                    <Phone size={18} />
                </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">نظام إدارة المخالات المتطور - أرديس</div>
        </div>
    );
};
