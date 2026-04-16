import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TigerLogo } from './TigerLogo';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 800); // Wait for fade out animation
        }, 3000); // Show for 3 seconds

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[1000] bg-brand-dark flex flex-col items-center justify-center gap-8"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative"
                    >
                        <TigerLogo size={180} />
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
                            className="absolute -bottom-4 left-0 h-1 bg-brand-primary rounded-full shadow-glow"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
                        className="text-center"
                    >
                        <h1 className="text-4xl font-bold tracking-widest text-white mb-2">أرديس</h1>
                        <p className="text-brand-primary text-sm font-medium tracking-[0.2em] uppercase">Premium Management System</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
