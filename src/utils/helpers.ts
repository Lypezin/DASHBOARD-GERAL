/**
 * Helpers gerais do projeto.
 */

export * from './filters/payloadBuilder';

export const safeNumber = (value: unknown): number => {
    const num = Number(value);
    return Number.isNaN(num) ? 0 : num;
};
