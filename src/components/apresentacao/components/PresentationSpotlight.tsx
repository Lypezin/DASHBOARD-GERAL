'use client';

import React, { useEffect } from 'react';
import { motion, useMotionTemplate, useReducedMotion, useSpring, useMotionValue } from 'framer-motion';

export const PresentationSpotlight: React.FC = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth movement
    const springConfig = { damping: 25, stiffness: 200 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);
    const shouldReduceMotion = useReducedMotion();
    const background = useMotionTemplate`radial-gradient(600px circle at ${springX}px ${springY}px, rgba(59, 130, 246, 0.04), transparent 80%)`;

    useEffect(() => {
        if (shouldReduceMotion || !window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches) {
            return;
        }

        let frameId: number | null = null;
        let nextX = 0;
        let nextY = 0;

        const updateSpotlight = () => {
            frameId = null;
            mouseX.set(nextX);
            mouseY.set(nextY);
        };

        const handleMouseMove = (e: MouseEvent) => {
            nextX = e.clientX;
            nextY = e.clientY;

            if (frameId === null) {
                frameId = window.requestAnimationFrame(updateSpotlight);
            }
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (frameId !== null) {
                window.cancelAnimationFrame(frameId);
            }
        };
    }, [mouseX, mouseY, shouldReduceMotion]);

    if (shouldReduceMotion) return null;

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
                background,
            }}
            className="presentation-spotlight hidden lg:block print:hidden"
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
