import React from 'react';
import { cn } from '@/lib/utils';

interface SlideHeaderProps {
    title: string;
    subTitle: string;
    titleKey?: string;
}

export const SlideHeader: React.FC<SlideHeaderProps> = ({ title, subTitle }) => {
    return (
        <header className="text-center mb-5 group">
            <div className="inline-block">
                <h2 className="text-[2.25rem] font-black tracking-wider text-blue-600 leading-none uppercase outline-none rounded transition-colors">
                    {title}
                </h2>
                <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-full mt-2" />
            </div>
            <p className="text-lg font-light text-slate-500 mt-2 outline-none rounded transition-colors">
                {subTitle}
            </p>
        </header>
    );
};
