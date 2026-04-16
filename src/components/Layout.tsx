import React from 'react';
import {
    BarChart3,
    Users,
    Palette,
    ArrowUpRight,
    ArrowDownLeft,
    Settings,
    FileText
} from 'lucide-react';
import { cn } from '../utils/cn';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}
const SidebarItem = ({
    icon: Icon,
    label,
    active,
    onClick
}: {
    icon: any,
    label: string,
    active?: boolean,
    onClick?: () => void
}) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer border border-transparent",
            active
                ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20 shadow-glow"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
        )}
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {

    const navItems = [
        { id: 'dashboard', label: 'لوحة التحكم', icon: BarChart3 },
        { id: 'outgoing', label: 'سحب مخالات', icon: ArrowUpRight },
        { id: 'returns', label: 'مرتجعات', icon: ArrowDownLeft },
        { id: 'users', label: 'المستخدمين', icon: Users },
        { id: 'colors', label: 'ألوان الصناديق', icon: Palette },
        { id: 'reports', label: 'التقارير', icon: FileText },
    ];

    return (
        <div className="min-h-screen flex bg-brand-dark text-white">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-brand-surface border-r border-brand-border/50 p-6 print:hidden">
                <div className="mb-10 flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center shadow-glow">
                        <span className="text-xl font-bold text-white">A</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">أرديس</h1>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">إدارة المخالات</p>
                    </div>
                </div>

                <nav className="flex-1 flex flex-col gap-2">
                    {navItems.map((item) => (
                        <SidebarItem
                            key={item.id}
                            icon={item.icon}
                            label={item.label}
                            active={activeTab === item.id}
                            onClick={() => setActiveTab(item.id)}
                        />
                    ))}
                </nav>

                <div className="mt-auto pt-6 border-t border-brand-border">
                    <SidebarItem icon={Settings} label="الإعدادات" />
                </div>
            </aside>

            {/* Mobile Header (Simplified) */}
            <div
                style={{ height: 'var(--header-height)' }}
                className="lg:hidden fixed top-0 left-0 right-0 z-[60] bg-brand-dark/95 backdrop-blur-3xl border-b border-white/5 px-6 flex items-center justify-center pt-safe print:hidden"
            >
                <h1 className="text-xl font-bold tracking-tight text-white">أرديس</h1>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-brand-dark/90 backdrop-blur-xl border-t border-white/5 pb-safe print:hidden">
                <nav className="flex items-center justify-around px-2 py-2 sm:py-3">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all duration-300 min-w-[64px]",
                                    isActive
                                        ? "text-brand-primary"
                                        : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    isActive ? "bg-brand-primary/10" : "bg-transparent"
                                )}>
                                    <Icon size={20} className={isActive ? "drop-shadow-glow" : ""} />
                                </div>
                                <span className={cn(
                                    "text-[9px] font-medium transition-colors",
                                    isActive ? "text-brand-primary" : "text-gray-500"
                                )}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 pb-24 lg:p-12 pt-8 lg:pt-12 overflow-y-auto print:p-0 print:overflow-visible relative w-full">
                <div className="max-w-6xl mx-auto w-full lg:pt-0 mobile-page-container">
                    {children}
                </div>
            </main>
        </div>
    );
};
