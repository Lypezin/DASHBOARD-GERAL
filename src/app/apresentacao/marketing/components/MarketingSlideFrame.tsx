import React from 'react';

export function MarketingSlideFrame({
    id,
    className = '',
    children,
}: {
    id: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div id={id} className={`page marketing-slide-frame ${className}`.trim()}>
            <div className="marketing-slide-canvas">
                <div className="marketing-slide-content">
                    {children}
                </div>
            </div>
        </div>
    );
}
