export interface UsuarioOnline {
    user_id: string;
    email: string;
    nome: string | null;
    pracas: string[];
    ultima_acao: string;
    aba_atual: string | null;
    filtros: Record<string, unknown>;
    ultima_atividade: string;
    segundos_inativo: number;
    acoes_ultima_hora: number;
    is_active?: boolean;
}
