/**
 * Marketing Data Fetcher - Barrel File
 * Centraliza as exportações de todos os módulos de busca de dados de marketing.
 * Cada módulo individual possui menos de 100 linhas para facilitar a manutenção.
 */

export * from './marketing/constants';
export * from './marketing/dateUtils';
export * from './marketing/fetchers/totalsFetcher';
export * from './marketing/fetchers/citiesFetcher';
export * from './marketing/fetchers/evolutionFetcher';
export * from './marketing/fetchers/weeklyComparisonFetcher';
export * from './marketing/fetchers/costsComparisonFetcher';
export * from './marketing/fetchers/weeklyCityComparisonFetcher';
