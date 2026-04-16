import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { cn } from '../utils/cn';

interface LoginScreenProps {
    onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '123456') {
            onLogin();
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 bg-brand-dark flex flex-col items-center justify-center p-4 z-50">
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(0,183,211,0.08)_0%,rgba(0,0,0,0)_50%)] animate-slow-spin"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-4xl bg-[radial-gradient(circle_at_center,rgba(0,183,211,0.05)_0%,rgba(0,0,0,0)_60%)] blur-3xl"></div>
            </div>

            <div className="glass-card w-full max-w-md p-8 rounded-3xl relative z-10 border border-brand-primary/20 shadow-2xl shadow-brand-primary/10">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/30 shadow-[0_0_15px_rgba(0,183,211,0.2)]">
                        <Lock className="text-brand-primary" size={40} />
                    </div>
                </div>
                
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight mb-2">أرديس للمخالات</h1>
                    <p className="text-gray-400">يرجى إدخال كلمة المرور للوصول للنظام</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6" dir="ltr">
                    <div className="relative">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(false);
                            }}
                            placeholder="Password"
                            className={cn(
                                "w-full bg-black/40 border rounded-xl px-5 py-4 text-center text-xl tracking-[0.5em] font-mono text-white placeholder-gray-600 focus:outline-none transition-all",
                                error ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-shake" : "border-brand-border focus:border-brand-primary focus:shadow-[0_0_15px_rgba(0,183,211,0.3)]"
                            )}
                            autoFocus
                        />
                        {error && (
                            <p className="text-red-400 text-sm font-bold mt-2 text-center" dir="rtl">كلمة المرور غير صحيحة!</p>
                        )}
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-brand-primary text-black font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#00c8e6] transition-all shadow-[0_0_15px_rgba(0,183,211,0.4)] hover:shadow-[0_0_25px_rgba(0,183,211,0.6)] cursor-pointer"
                    >
                        تسجيل الدخول <ArrowRight size={20} className="rotate-180" />
                    </button>
                    <div className="text-center mt-2">
                        <span className="text-xs text-gray-500 font-bold tracking-widest">SECURE ACCESS</span>
                    </div>
                </form>
            </div>
        </div>
    );
};
