# Instruções para Forçar Logout de Todos os Usuários

Este sistema permite forçar logout de todos os usuários uma vez, útil após atualizações que causaram problemas de sessão.

## Como Funciona

O componente `ForceLogoutChecker` verifica no banco de dados Supabase se o logout forçado está ativo. Quando ativo, força logout de todos os usuários que acessarem o sistema. Após executar, a flag é desativada automaticamente no banco de dados.

## Como Ativar

### Método 1: Usando SQL no Supabase (Recomendado)

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute a seguinte query:

```sql
SELECT public.activate_force_logout();
```

Ou diretamente:

```sql
UPDATE public.force_logout_config
SET is_active = true,
    updated_at = now()
WHERE id = 1;
```

### Método 2: Usando a Interface do Supabase

1. Acesse o Supabase Dashboard
2. Vá em **Table Editor**
3. Selecione a tabela `force_logout_config`
4. Edite a linha com `id = 1`
5. Altere `is_active` para `true`
6. Salve

## Como Desativar

### Método 1: Usando SQL

```sql
SELECT public.deactivate_force_logout();
```

Ou diretamente:

```sql
UPDATE public.force_logout_config
SET is_active = false,
    executed_at = now(),
    updated_at = now()
WHERE id = 1;
```

### Método 2: Usando a Interface do Supabase

1. Acesse o Supabase Dashboard
2. Vá em **Table Editor**
3. Selecione a tabela `force_logout_config`
4. Edite a linha com `id = 1`
5. Altere `is_active` para `false`
6. Salve

## O Que Acontece Quando Ativado

1. Todos os usuários que acessarem o sistema serão automaticamente deslogados
2. Todas as sessões do Supabase serão limpas
3. Os dados de autenticação no localStorage serão removidos
4. Os usuários serão redirecionados para a página de login
5. Após executar, a flag é automaticamente desativada no banco de dados

## Verificar Status

Para verificar se está ativo:

```sql
SELECT * FROM public.force_logout_config WHERE id = 1;
```

Ou usar a função:

```sql
SELECT public.check_force_logout();
```

## Importante

- ⚠️ **Use apenas quando necessário**: Esta funcionalidade força logout de TODOS os usuários
- ✅ **Executa apenas uma vez**: Após executar, a flag é desativada automaticamente no banco
- 🔄 **Não requer deploy**: A ativação/desativação é feita diretamente no banco de dados
- 🔒 **Seguro**: A flag é verificada no banco, garantindo controle centralizado

## Verificação

Após ativar, quando qualquer usuário acessar o sistema:
- Será automaticamente deslogado
- Verá a página de login
- Poderá fazer login novamente normalmente
- A flag será automaticamente desativada após a execução

## Estrutura da Tabela

A tabela `force_logout_config` possui:
- `id`: Sempre 1 (singleton)
- `is_active`: Boolean indicando se está ativo
- `executed_at`: Data/hora da última execução
- `created_at`: Data de criação
- `updated_at`: Data da última atualização

