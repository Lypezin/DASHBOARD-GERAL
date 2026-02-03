# Instruções para Atualização do Banco de Dados

Ops! Parece que minha conexão automática com o Supabase (MCP) não tem permissões suficientes para criar tabelas ou executar scripts de modificação (Erro: "Your account does not have the necessary privileges").

Para que as novas funcionalidades de **Monitoramento de Usuários** e **Novas Conquistas** funcionem, você precisa executar os scripts SQL manualmente.

## Passo a Passo

1.  Acesse o **SQL Editor** no painel do seu projeto Supabase.
2.  **Copie e execute** o conteúdo do arquivo:
    *   `sql/create_activity_logs.sql`
    *   *(Isso criará a tabela de logs de atividade)*
3.  **Copie e execute** o conteúdo do arquivo:
    *   `sql/update_monitoring_and_badges.sql`
    *   *(Isso adicionará a coluna `last_seen` e as novas conquistas)*

## Verificação

Após executar os scripts, recarregue a aplicação.
- A aba **Monitoramento** no painel Admin deve funcionar.
- As novas conquistas (Coruja Noturna, Maratonista, etc.) devem aparecer na galeria.
