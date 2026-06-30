import React from 'react';

export const Section = ({ show, children }: { show: boolean, children: React.ReactNode }) => {
    if (!show) return null;
    return (
        <section className="min-w-0" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 520px' }}>
            {children}
        </section>
    );
};
