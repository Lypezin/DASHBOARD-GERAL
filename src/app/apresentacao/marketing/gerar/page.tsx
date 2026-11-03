import type { Metadata } from 'next';
import { MarketingGeneratedPresentation } from './MarketingGeneratedPresentation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Apresentação Marketing',
};

export default function MarketingGeneratedPage({ searchParams }: { searchParams: { data?: string } }) {
  return <MarketingGeneratedPresentation reportDate={searchParams.data || ''} />;
}
