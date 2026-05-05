'use client';

import React from 'react';
import EntregadoresMainView from './EntregadoresMainView';
import type { CurrentUser } from '@/types';
import type { FilterPayload } from '@/types/filters';

const DedicadoView = React.memo(function DedicadoView({
  filterPayload,
  currentUser,
}: {
  filterPayload: FilterPayload;
  currentUser: CurrentUser | null;
}) {
  return (
    <EntregadoresMainView
      filterPayload={filterPayload}
      currentUser={currentUser}
      variant="dedicado"
    />
  );
});

DedicadoView.displayName = 'DedicadoView';

export default DedicadoView;
