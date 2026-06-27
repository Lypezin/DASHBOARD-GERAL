/**
 * Utilitarios para mapeamento de atendentes.
 */

export const ATENDENTES = [
  'Fernanda Raphaelly',
  'Beatriz Angelo',
  'Carolini Braguini',
] as const;

export const ATENDENTES_FOTOS: { [key: string]: string | null } = {
  'Fernanda Raphaelly': 'https://ulmobmmlkevxswxpcyza.supabase.co/storage/v1/object/public/avatars/foto%20atendentes/FERNANDA%20FOTO.png',
  'Beatriz Angelo': 'https://ulmobmmlkevxswxpcyza.supabase.co/storage/v1/object/public/avatars/foto%20atendentes/FOTO%20BEATRIZ.png',
  'Carolini Braguini': 'https://ulmobmmlkevxswxpcyza.supabase.co/storage/v1/object/public/avatars/foto%20atendentes/CAROL%20FOTO.jpg',
};

export const ATENDENTE_TO_ID: { [key: string]: string | string[] } = {
  'Carolini Braguini': '6905',
  'Beatriz Angelo': ['6976', '2387'],
  'Fernanda Raphaelly': '4182',
  'Mariane Zocoli': '5447',
};

export const REGIAO_TO_CIDADE_VALORES: { [key: string]: string } = {
  'São Paulo 2.0': 'SÃO PAULO',
  'Manaus 2.0': 'MANAUS',
  'ABC 2.0': 'ABC',
  'Sorocaba 2.0': 'SOROCABA',
  'Guarulhos 2.0': 'GUARULHOS',
  'Salvador 2.0': 'SALVADOR',
  'Taboão da Serra e Embu das Artes 2.0': 'TABOÃO DA SERRA E EMBU DAS ARTES',
};
