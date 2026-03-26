'use client';

import React, { useState } from 'react';
import { ValoresCidadeDateFilter, MarketingDateFilter } from '@/types';
import { useValoresCidadeAuth } from '@/hooks/valoresCidade/useValoresCidadeAuth';
import { useValoresCidadeData } from '@/hooks/valoresCidade/useValoresCidadeData';
import { useValoresCidadeFilters } from '@/hooks/valoresCidade/useValoresCidadeFilters';
import { ValoresCidadeAuth } from './valoresCidade/ValoresCidadeAuth';
import { ValoresCidadeFilters } from './valoresCidade/ValoresCidadeFilters';
import { ValoresCidadeCards } from './valoresCidade/ValoresCidadeCards';
import { ValoresCidadeHeader } from './valoresCidade/ValoresCidadeHeader';
import { ValoresCidadeFeedback } from './valoresCidade/ValoresCidadeFeedback';
import { motion, Variants } from 'framer-motion';

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const ValoresCidadeView = React.memo(function ValoresCidadeView() {
  const { isAuthenticated, password, passwordError, loading: authLoading, setPassword, handlePasswordSubmit } = useValoresCidadeAuth();
  const { filter, filterEnviados, handleFilterChange, handleFilterEnviadosChange } = useValoresCidadeFilters();

  const { loading, error, cidadesData, totalGeral, custoPorLiberado } = useValoresCidadeData(isAuthenticated, filter, filterEnviados);

  if (!isAuthenticated) return <ValoresCidadeAuth password={password} passwordError={passwordError} loading={authLoading} onPasswordChange={setPassword} onSubmit={handlePasswordSubmit} />;

  if (loading || error) return <ValoresCidadeFeedback loading={loading} error={error} />;

  return (
    <motion.div className="space-y-6 animate-fade-in pb-8" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="space-y-4">
        <ValoresCidadeHeader />
        <ValoresCidadeFilters filter={filter} filterEnviados={filterEnviados} onFilterChange={handleFilterChange} onFilterEnviadosChange={handleFilterEnviadosChange} />
      </motion.div>

      <motion.div variants={item}>
        <ValoresCidadeCards totalGeral={totalGeral} custoPorLiberado={custoPorLiberado} cidadesData={cidadesData} />
      </motion.div>
    </motion.div>
  );
});

ValoresCidadeView.displayName = 'ValoresCidadeView';

export default ValoresCidadeView;

