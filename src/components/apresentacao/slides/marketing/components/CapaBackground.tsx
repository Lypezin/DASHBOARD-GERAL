'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CapaBackgroundProps {
    isDark: boolean;
}

export const CapaBackground: React.FC<CapaBackgroundProps> = ({ isDark }) => {
    return (
        <>
            <div className={`absolute inset-0 opacity-80 transition-opacity duration-500 ${
                isDark 
                ? 'bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,#020617_100%)]' 
                : 'bg-[radial-gradient(circle_at_50%_50%,#ffffff_0%,#f8fafc_100%)]'
            }`} />

            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                    opacity: isDark ? [0.15, 0.25, 0.15] : [0.4, 0.6, 0.4]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute top-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full blur-[120px] ${
                    isDark ? 'bg-blue-600/20' : 'bg-blue-200/50'
                }`}
            />
            
            <motion.div 
                animate={{ 
                    scale: [1.2, 1, 1.2],
                    x: [0, -40, 0],
                    y: [0, 40, 0],
                    opacity: isDark ? [0.1, 0.2, 0.1] : [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute bottom-[-10%] left-[-15%] w-[800px] h-[800px] rounded-full blur-[150px] ${
                    isDark ? 'bg-indigo-500/15' : 'bg-indigo-100/40'
                }`}
            />

            <motion.div 
                animate={{ 
                    rotate: [0, 360],
                    opacity: [0.05, 0.1, 0.05]
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className={`absolute top-[20%] left-[10%] w-[300px] h-[300px] border-[1px] rounded-[60px] ${
                    isDark ? 'border-blue-400' : 'border-blue-600'
                }`}
            />
        </>
    );
};
