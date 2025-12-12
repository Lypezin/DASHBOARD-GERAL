import { DashboardSkeleton } from './DashboardSkeleton';

interface DashboardLoadingStateProps {
  message?: string;
}

export const DashboardLoadingState = React.memo(function DashboardLoadingState({
  message = 'Carregando dashboard...',
}: DashboardLoadingStateProps) {
  return <DashboardSkeleton />;
});

DashboardLoadingState.displayName = 'DashboardLoadingState';

