/**
 * Utilitários para mapeamento de atendentes
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
  'Beatriz Angelo': ['6976', '2387']
  'Fernanda Raphaelly': ['5447', '4182'],
};

export const CIDADE_TO_REGIAO: { [key: string]: string } = {
  'SÃO PAULO': 'São Paulo 2.0',
  'MANAUS': 'Manaus 2.0',
  'ABC': 'ABC 2.0',
  'SOROCABA': 'Sorocaba 2.0',
  'GUARULHOS': 'Guarulhos 2.0',
  'SALVADOR': 'Salvador 2.0',
  'TABOÃO DA SERRA E EMBU DAS ARTES': 'Taboão da Serra e Embu das Artes 2.0',
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

/**
 * Encontra o nome do atendente pelo ID
 */
export function findAtendenteNomeById(id: string): string {
  const idNormalizado = String(id).trim();
  for (const [nome, atendenteIds] of Object.entries(ATENDENTE_TO_ID)) {
    // Suporta tanto string única quanto array de IDs
    const ids = Array.isArray(atendenteIds) ? atendenteIds : [atendenteIds];
    if (ids.some(aid => String(aid).trim() === idNormalizado)) {
      return nome;
    }
  }
  return '';
}

/**
 * Encontra valor de cidade com múltiplas tentativas de mapeamento
 */
export function findCidadeValue(
  cidadeData: { cidade: string },
  valoresAtendente: Map<string, number>
): number {
  const cidadeUpper = cidadeData.cidade.toUpperCase().trim();
  const cidadeNormalizada = cidadeData.cidade.trim();

  // Tentar encontrar o valor usando o nome da cidade diretamente
  let valorCidade = valoresAtendente.get(cidadeNormalizada) || 0;

  if (valorCidade === 0) {
    // Se for uma cidade do ABC, tentar buscar por "ABC"
    if (cidadeData.cidade === 'Santo André' || cidadeData.cidade === 'São Bernardo' || cidadeData.cidade === 'ABC 2.0') {
      valorCidade = valoresAtendente.get('ABC') || valoresAtendente.get('ABC 2.0') || 0;
    } else {
      // Tentar buscar pelo nome em maiúsculas ou pelo mapeamento
      const regiaoMapeada = REGIAO_TO_CIDADE_VALORES[cidadeData.cidade] || cidadeUpper;
      valorCidade = valoresAtendente.get(regiaoMapeada) ||
        valoresAtendente.get(cidadeUpper) ||
        valoresAtendente.get(cidadeNormalizada) ||
        valoresAtendente.get(cidadeData.cidade) || 0;

      // Se ainda não encontrou, tentar todas as variações possíveis
      if (valorCidade === 0) {
        for (const [cidadeKey, valor] of valoresAtendente.entries()) {
          if (cidadeKey.toUpperCase().trim() === cidadeUpper ||
            cidadeKey.trim() === cidadeNormalizada ||
            cidadeKey.toUpperCase().trim() === regiaoMapeada.toUpperCase().trim()) {
            valorCidade = valor;
            break;
          }
        }
      }
    }
  }

  return valorCidade;
}

