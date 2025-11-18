# Instruções para Forçar Logout de Todos os Usuários

Este sistema permite forçar logout de todos os usuários uma vez, útil após atualizações que causaram problemas de sessão.

## Como Funciona

O componente `ForceLogoutChecker` verifica no banco de dados Supabase se o logout forçado está ativo. Quando ativo, força logout de **todos os usuários** que acessarem o sistema. A flag permanece ativa até que você a desative manualmente, garantindo que todos os usuários sejam deslogados.

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

1. **Todos os usuários** que acessarem o sistema serão automaticamente deslogados
2. Todas as sessões do Supabase serão limpas
3. Os dados de autenticação no localStorage serão removidos
4. Os usuários serão redirecionados para a página de login
5. **A flag permanece ativa** até que você a desative manualmente
6. Após fazer login novamente, os usuários **não serão mais deslogados** (a flag só desloga na primeira vez que acessam)

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
- ✅ **Desative manualmente**: Após garantir que todos foram deslogados, **desative a flag manualmente**
- 🔄 **Não requer deploy**: A ativação/desativação é feita diretamente no banco de dados
- 🔒 **Seguro**: A flag é verificada no banco, garantindo controle centralizado
- 🔁 **Funciona por sessão**: Cada usuário será deslogado apenas uma vez por sessão (usando sessionStorage)

## Fluxo de Uso Recomendado

1. **Ative a flag**: `SELECT public.activate_force_logout();`
2. **Aguarde alguns minutos**: Todos os usuários que acessarem serão deslogados
3. **Verifique se todos foram deslogados**: Aguarde um tempo razoável (ex: 10-15 minutos)
4. **Desative a flag**: `SELECT public.deactivate_force_logout();`

## Verificação

Após ativar, quando qualquer usuário acessar o sistema:
- Será automaticamente deslogado na primeira vez que acessar
- Verá a página de login
- Poderá fazer login novamente normalmente
- **Após fazer login, não será mais deslogado** (mesmo que a flag ainda esteja ativa)
- A flag permanece ativa até você desativá-la manualmente

## Estrutura da Tabela

A tabela `force_logout_config` possui:
- `id`: Sempre 1 (singleton)
- `is_active`: Boolean indicando se está ativo
- `executed_at`: Data/hora da última execução
- `created_at`: Data de criação
- `updated_at`: Data da última atualização

