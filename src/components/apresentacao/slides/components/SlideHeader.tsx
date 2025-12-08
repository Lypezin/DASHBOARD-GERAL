import React from 'react';

interface SlideHeaderProps {
    title: string;
    subTitle: string;
}

export const SlideHeader: React.FC<SlideHeaderProps> = ({ title, subTitle }) => {
    return (
        <header className="text-center mb-5">
            <div className="inline-block">
                <h2 className="text-[2.25rem] font-black tracking-wider text-blue-600 leading-none uppercase">
                    {title}
                </h2>
                <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-full mt-2" />
            </div>
            <p className="text-lg font-light text-slate-500 mt-2">
                {subTitle}
            </p>
        </header>
    );
};
