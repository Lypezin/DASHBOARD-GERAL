import { validateString } from '@/lib/validate';
import { convertDDMMYYYYToDate } from '../uploadHelpers';

/**
 * Transformadores comuns para reutilização em processamento de Excel
 */
export const commonTransformers = {
    /** Transforma data DD/MM/YYYY para YYYY-MM-DD */
    date: (value: unknown, rowIndex: number): string | null => {
        const converted = convertDDMMYYYYToDate(typeof value === 'string' || typeof value === 'number' || value == null ? value : String(value));
        return converted || null;
    },

    /** Transforma data obrigatória (lança erro se inválida) */
    requiredDate: (value: unknown, rowIndex: number): string => {
        const converted = convertDDMMYYYYToDate(typeof value === 'string' || typeof value === 'number' || value == null ? value : String(value));
        if (!converted) throw new Error(`Data inválida: ${value}`);
        return converted;
    },

    /**
     * Sanitiza string
     */
    string: (maxLength: number = 500) => (value: unknown, rowIndex: number): string | null => {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        if (typeof value === 'string') {
            try {
                return validateString(value, maxLength, 'Campo', true);
            } catch (e) {
                return String(value).substring(0, maxLength).replace(/[<>'"]/g, '');
            }
        }
        return String(value).trim();
    },

    /**
     * Transforma valor numérico
     */
    number: (value: unknown, rowIndex: number): number => {
        if (value === null || value === undefined || value === '') {
            throw new Error('Valor numérico não pode ser vazio');
        }

        if (typeof value === 'number') return value;

        const strValue = String(value).trim();

        // Remover símbolos de moeda e espaços
        let cleanValue = strValue.replace(/[R$\s]/g, '');

        // Lógica para detectar formato BR (1.234,56) vs US (1,234.56)
        if (cleanValue.includes(',') && cleanValue.includes('.')) {
            // Formato misto. Assumir ponto como milhar se aparecer antes da vírgula
            if (cleanValue.indexOf('.') < cleanValue.indexOf(',')) {
                // Formato BR: 1.234,56 -> 1234.56
                cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
            } else {
                // Formato US: 1,234.56 -> 1234.56
                cleanValue = cleanValue.replace(/,/g, '');
            }
        } else if (cleanValue.includes(',')) {
            // Apenas vírgula: Assumir separador decimal (BR)
            cleanValue = cleanValue.replace(',', '.');
        }

        // Remover quaisquer outros caracteres não numéricos (exceto ponto e menos)
        cleanValue = cleanValue.replace(/[^\d.-]/g, '');

        const numValue = parseFloat(cleanValue);

        if (isNaN(numValue)) {
            throw new Error(`Valor inválido: ${value}`);
        }
        return numValue;
    },

    /**
     * Normaliza "Rodando" para "Sim" ou "Não"
     */
    rodando: (value: unknown, rowIndex: number): string | null => {
        if (value && typeof value === 'string') {
            const n = value.trim().toLowerCase();
            if (['sim', 's', 'yes', 'y', '1', 'true'].includes(n)) return 'Sim';
            if (['não', 'nao', 'n', 'no', '0', 'false', ''].includes(n)) return 'Não';
            return value.trim() || null;
        } else if (value) {
            const num = Number(value);
            if (num === 1) return 'Sim';
            if (num === 0) return 'Não';
        }
        return null;
    },
};
