/**
 * Componente para indicador de força de senha
 * Extraído de src/app/registro/page.tsx
 */

import React from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
  strength: number;
  label: string;
  color: string;
}

export const PasswordStrengthIndicator = React.memo(function PasswordStrengthIndicator({
  password,
  strength,
  label,
  color,
}: PasswordStrengthIndicatorProps) {
  if (password.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-white/5">
        <div 
          className={`h-full transition-all duration-300 ${color}`}
          style={{ width: `${(strength / 5) * 100}%` }}
        ></div>
      </div>
      <p className="text-xs font-medium text-slate-400">
        {label && `Força: ${label}`}
        {!label && 'Mínimo de 6 caracteres'}
      </p>
    </div>
  );
});

PasswordStrengthIndicator.displayName = 'PasswordStrengthIndicator';

