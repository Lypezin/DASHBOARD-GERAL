
import React from 'react';
import { FilterOption, CurrentUser } from '@/types';
import { useComparacaoViewController } from './comparacao/hooks/useComparacaoViewController';
import { ComparacaoLayout } from './comparacao/ComparacaoLayout';

const ComparacaoView = React.memo(function ComparacaoView(props: {
  semanas: string[];
  pracas: FilterOption[];
  subPracas: FilterOption[];
  origens: FilterOption[];
  currentUser: CurrentUser | null;
  anoSelecionado?: number;
}) {
  const { state, data, actions } = useComparacaoViewController(props);

  return (
    <ComparacaoLayout
      pracas={props.pracas}
      state={state}
      data={data}
      actions={actions}
    />
  );
});

ComparacaoView.displayName = 'ComparacaoView';

export default ComparacaoView;
