# 🔧 INSTRUÇÕES PARA EXECUTAR SQL DE MONITORAMENTO

## ⚠️ IMPORTANTE
O sistema de monitoramento em tempo real requer a execução do SQL no banco de dados.

## 📝 Passos para Executar:

### 1. Acessar o Supabase SQL Editor
- Acesse: https://supabase.com/dashboard
- Selecione seu projeto
- Vá em "SQL Editor" no menu lateral

### 2. Copiar o SQL
- Abra o arquivo: `CREATE_SISTEMA_MONITORAMENTO.sql`
- Copie TODO o conteúdo do arquivo (Ctrl+A, Ctrl+C)

### 3. Executar no SQL Editor
- Cole o conteúdo no SQL Editor do Supabase
- Clique em "Run" (▶️)
- Aguarde a confirmação de sucesso

### 4. Verificar Criação
Execute esta query para verificar se tudo foi criado:

```sql
-- Verificar tabela
SELECT COUNT(*) FROM public.user_activities;

-- Verificar funções
SELECT proname FROM pg_proc WHERE proname IN ('registrar_atividade', 'listar_usuarios_online', 'historico_atividades_usuario');
```

## ✅ Após Executar
- O sistema de monitoramento estará ativo
- Admins poderão ver usuários online na aba "Monitoramento"
- O sistema registrará automaticamente:
  - Logins
  - Mudanças de aba
  - Mudanças de filtros
  - Heartbeats (a cada 1 minuto)

## 🐛 Troubleshooting
Se der erro:
1. Verifique se você tem permissões de admin no Supabase
2. Execute seção por seção do SQL
3. Verifique se a tabela `user_profiles` existe
4. Se necessário, execute apenas a criação da tabela primeiro, depois as funções

