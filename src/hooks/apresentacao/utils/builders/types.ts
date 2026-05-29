import React from 'react';

// Interface for the slide config return type
export interface SlideConfig {
    key: string;
    render: (visible: boolean) => React.ReactNode;
}
