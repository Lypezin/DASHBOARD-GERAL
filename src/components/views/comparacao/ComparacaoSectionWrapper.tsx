import React from 'react';
import { motion } from 'framer-motion';
import { fadeInItem } from '@/utils/animations';

export const Section = ({ show, children }: { show: boolean, children: React.ReactNode }) => {
    if (!show) return null;
    return <motion.div variants={fadeInItem}>{children}</motion.div>;
};
