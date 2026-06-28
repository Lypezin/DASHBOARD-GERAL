import React from 'react';

export const Section = ({ show, children }: { show: boolean, children: React.ReactNode }) => {
    if (!show) return null;
    return <div className="motion-safe:animate-fade-in">{children}</div>;
};
