export const IS_DEV = process.env.NODE_ENV === 'development';

export const EXCLUDED_ENVIADOS = ['Confirmar', 'Cancelado', 'Abrindo MEI'];

export const ABERTO_STATUSES = [
    'Aberto', 
    'aguardando liberação', 
    'Aguardando Liberação',
    'Aguardando Liberação Onboarding', 
    'retorno',
    'Retorno', 
    'a enviar',
    'A enviar 2.0'
];

export const VOLTOU_STATUSES = [
    'voltou', 
    'Voltou', 
    'entregador desistiu', 
    'Entregador desistiu', 
    'bug onboarding',
    'Bug Onboarding',
    'Bug (Onboarding)',
    'Bug (onboarding)',
    'bug (onboarding)'
];

// Mapeamento inverso para buscar no RPC/Custos
export const DISPLAY_CITY_TO_DB_CITY: Record<string, string> = {
    'São Paulo 2.0': 'SAO PAULO',
    'Salvador 2.0': 'SALVADOR',
    'Guarulhos 2.0': 'GUARULHOS',
    'Manaus 2.0': 'MANAUS',
    'Sorocaba 2.0': 'SOROCABA',
    'ABC 2.0': 'ABC'
};

export const SLIDE_CITIES = [
    'São Paulo 2.0',
    'Guarulhos 2.0',
    'Manaus 2.0',
    'ABC 2.0',
    'Sorocaba 2.0',
    'Salvador 2.0'
];

export const PRIORITY_CITIES = [
    'São Paulo', 
    'Guarulhos', 
    'Manaus', 
    'ABC', 
    'Sorocaba', 
    'Salvador', 
    'Taboão/Embu', 
    'Outros'
];
