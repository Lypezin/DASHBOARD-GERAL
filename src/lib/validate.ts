/**
 * Funções de validação de entrada para prevenir ataques
 * e garantir integridade dos dados
 */

import type { FilterPayload, ValidatedFilterPayload } from '@/types/filters';
import { validateDateFilters } from './validators/dateValidators';
import { validateLocationFilters } from './validators/locationValidators';
import { validateAuxiliaryFilters } from './validators/auxiliaryValidators';

// Re-export common validators for compatibility
export { validateInteger, validateString } from './validators/commonValidators';

/**
 * Valida e sanitiza payload de filtros para funções RPC
 */
export function validateFilterPayload(payload: FilterPayload): ValidatedFilterPayload {
  const validatedDates = validateDateFilters(payload);
  const validatedLocations = validateLocationFilters(payload);
  const validatedAux = validateAuxiliaryFilters(payload);

  return {
    ...validatedDates,
    ...validatedLocations,
    ...validatedAux,
  };
}
