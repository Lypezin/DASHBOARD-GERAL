/**
 * Transformers específicos para upload de dados
 * Centraliza lógica de transformação para diferentes tipos de upload
 */

import { validateString } from '@/lib/validate';
import { commonTransformers } from './excelProcessor';

/**
 * Transformers para dados de Marketing
 */
export const marketingTransformers = {
  // Datas opcionais (podem ser null)
  data_liberacao: commonTransformers.date,
  data_envio: commonTransformers.date,
  rodou_dia: commonTransformers.date,

  // Rodando - normalizar para "Sim" ou "Não"
  rodando: commonTransformers.rodando,

  // Strings opcionais
  nome: commonTransformers.string(500),
  status: commonTransformers.string(500),
  regiao_atuacao: commonTransformers.string(500),
  sub_praca_abc: commonTransformers.string(500),
  telefono_trabalho: commonTransformers.string(500),
  outro_telefone: commonTransformers.string(500),
  responsavel: commonTransformers.string(500),

  // id_entregador - opcional, pode ser null
  id_entregador: (value: unknown, rowIndex: number): string | null => {
    if (value && typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    } else if (value) {
      return String(value).trim();
    }
    return null;
  },
};

/**
 * Transformers para dados de Valores por Cidade
 */
export const valoresCidadeTransformers = {
  // Data obrigatória
  data: commonTransformers.requiredDate,

  // ID obrigatório
  id_atendente: (value: unknown, rowIndex: number): string => {
    if (value && typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') {
        throw new Error(`ID do atendente vazio na linha ${rowIndex + 2}`);
      }
      return trimmed;
    } else if (value) {
      return String(value).trim();
    }
    throw new Error(`ID do atendente inválido na linha ${rowIndex + 2}`);
  },

  // Cidade obrigatória
  cidade: (value: unknown, rowIndex: number): string => {
    if (value && typeof value === 'string') {
      try {
        return validateString(value, 200, 'cidade', false);
      } catch (e) {
        return value.trim();
      }
    } else if (value) {
      return String(value).trim();
    }
    throw new Error(`Cidade vazia na linha ${rowIndex + 2}`);
  },

  // Valor obrigatório (numérico)
  valor: commonTransformers.number,
};

