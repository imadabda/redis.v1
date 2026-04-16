import React from 'react';
import { motion } from 'framer-motion';

export const TigerLogo: React.FC<{ size?: number, color?: string }> = ({ size = 120, color = "#f45535" }) => {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
        >
            {/* Stylized Tiger/Big Cat Head */}
            <path d="M12 3c-1.5 0-3 1-3 3 0 1 .5 2 1 2.5.5.5 1 1 1.5 1.5.5.5 1 1 1 2.5s.5 2 1 2.5c.5.5 1 1 2.5 1s2-.5 2.5-1c.5-.5 1-1 1-2.5s.5-2 1-2.5c.5-.5 1-1 1.5-1.5.5-.5 1-1.5 1-2.5 0-2-1.5-3-3-3" />
            <path d="M9 6c0-1.5-1-3-3-3s-3 1.5-3 3c0 1 .5 2 1 2.5l2 2" />
            <path d="M15 6c0-1.5 1-3 3-3s3 1.5 3 3c0 1-.5 2-1 2.5l-2 2" />
            <path d="M12 14c-1 0-2 1-2 2s1 2 2 2 2-1 2-2-1-2-2-2z" />
            <path d="M10 16h4" />
            <path d="M8 12c-1.5 0-3 1-3 3" />
            <path d="M16 12c1.5 0 3 1 3 3" />
            <path d="M7 18a3 3 0 0 0 10 0" />
        </motion.svg>
    );
};
