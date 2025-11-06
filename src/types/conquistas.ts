export interface Conquista {
  conquista_id: string;
  codigo: string;
  nome: string;
  descricao: string;
  icone: string;
  categoria: 'dados' | 'analise' | 'frequencia' | 'social';
  pontos: number;
  raridade: 'comum' | 'rara' | 'epica' | 'lendaria';
  conquistada: boolean;
  conquistada_em: string | null;
  progresso: number;
  visualizada: boolean;
}

export interface ConquistaNova {
  conquista_nova: boolean;
  conquista_codigo: string;
  conquista_nome: string;
  conquista_icone: string;
  conquista_pontos: number;
}

