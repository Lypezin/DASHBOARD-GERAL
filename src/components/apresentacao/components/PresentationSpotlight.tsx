'use client';

import React, { useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export const PresentationSpotlight: React.FC = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth movement
    const springConfig = { damping: 25, stiffness: 200 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <motion.div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 9999,
                background: `radial-gradient(600px circle at var(--x) var(--y), rgba(59, 130, 246, 0.04), transparent 80%)`,
            }}
            className="hidden lg:block"
            animate={{
                '--x': springX.get() + 'px',
                '--y': springY.get() + 'px',
            } as any}
        >
            <motion.div
                style={{
                    position: 'absolute',
                    top: springY,
                    left: springX,
                    width: '300px',
                    height: '300px',
                    borderRadius: '100%',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                    transform: 'translate(-50%, -50%)',
                    filter: 'blur(20px)',
                }}
            />
        </motion.div>
    );
};
