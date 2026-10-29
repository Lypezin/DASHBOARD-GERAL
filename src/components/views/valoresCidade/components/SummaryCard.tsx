import React from 'react';
import { LucideIcon } from 'lucide-react';
import { SaasMetric } from '@/components/views/shared/SaasPrimitives';

interface SummaryCardProps {
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  tone?: 'blue' | 'slate';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, subtext, icon, tone = 'slate' }) => (
  <SaasMetric
    label={title}
    value={value}
    meta={subtext}
    icon={icon}
    tone={tone}
    size="lg"
    className="min-h-[112px] rounded-xl px-4 py-3"
  />
);
