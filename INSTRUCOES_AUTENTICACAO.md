# 🔐 Instruções para Configurar Autenticação

## 📋 Passo a Passo Completo

### **1. Executar o Script SQL**

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `auth_setup.sql`
4. Copie **TODO O CONTEÚDO**
5. Cole no SQL Editor
6. Clique em **RUN**
7. Aguarde a mensagem de sucesso

### **2. Criar Seu Primeiro Usuário Admin**

#### 2.1. Cadastrar-se no Sistema

1. Faça o deploy do projeto (ou rode localmente)
2. Acesse a página de **Registro**: `/registro`
3. Preencha:
   - **Nome Completo**: Seu nome
   - **Email**: Seu email
   - **Senha**: Mínimo 6 caracteres
4. Clique em **Criar Conta**
5. Você verá uma mensagem de "Aguardando aprovação"

#### 2.2. Promover sua Conta para Admin

Como você é o primeiro usuário, precisa se promover manualmente:

1. Volte ao **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute este comando (substitua `seu@email.com` pelo email que você usou):

```sql
UPDATE public.user_profiles
SET is_admin = TRUE, is_approved = TRUE
WHERE email = 'seu@email.com';
```

4. Clique em **RUN**
5. Agora você pode fazer login como admin!

### **3. Fazer Login**

1. Acesse `/login`
2. Entre com seu email e senha
3. Você será redirecionado para o dashboard
4. O botão **Admin** e **Upload** agora estão visíveis para você

---

## 👥 Como Funciona o Fluxo de Aprovação

### Para Novos Usuários:

1. **Cadastro**: Usuário se cadastra em `/registro`
2. **Aguarda**: Aparece mensagem "Aguardando aprovação"
3. **Admin aprova**: Admin vai em `/admin` e aprova o usuário
4. **Praças designadas**: Admin seleciona quais praças o usuário pode ver
5. **Login liberado**: Usuário pode fazer login e ver apenas suas praças

### Para Admin:

1. **Aprovar Cadastros**: Vá em `/admin`
2. **Selecionar Praças**: Ao aprovar, escolha 1 ou mais praças
3. **Gerenciar**: Você pode revogar ou alterar praças a qualquer momento

---

## 🔒 Permissões do Sistema

### **Administrador** (is_admin = true)
✅ Ver todas as praças  
✅ Fazer upload de dados  
✅ Aprovar/revogar usuários  
✅ Designar praças para usuários  
✅ Acessar página `/admin`  

### **Usuário Normal** (is_admin = false)
✅ Ver apenas praças designadas  
❌ Fazer upload (botão oculto)  
❌ Ver outros usuários  
❌ Acessar página `/admin`  

### **Usuário Não Aprovado** (is_approved = false)
❌ Não consegue fazer login  
❌ Recebe mensagem de "aguardando aprovação"

---

## 📊 Filtros Automáticos por Praça

Quando um usuário **não-admin** faz login:

- **Dashboard**: Mostra apenas dados das praças designadas
- **Análise Detalhada**: Idem
- **Comparação de Semanas**: Idem
- **Filtros**: Só aparecem as praças permitidas

O sistema usa **Row Level Security (RLS)** do Supabase para garantir isso no nível do banco de dados!

---

## 🧪 Testar o Sistema

### Teste 1: Login como Admin

```
1. Faça login com sua conta admin
2. Veja se o botão "Upload" aparece
3. Veja se o botão "Admin" aparece
4. Veja se você consegue ver todas as praças no dashboard
```

### Teste 2: Criar Usuário Normal

```
1. Abra uma janela anônima
2. Vá em /registro
3. Cadastre um novo usuário
4. Tente fazer login → deve dar erro "aguardando aprovação"
5. Volte como admin em /admin
6. Aprove o usuário e designe UMA praça
7. Volte como o novo usuário e faça login
8. Veja que só aparece a praça designada
9. Veja que o botão "Upload" NÃO aparece
```

---

## 🔧 Comandos SQL Úteis

### Ver Todos os Usuários

```sql
SELECT 
  full_name,
  email,
  is_admin,
  is_approved,
  assigned_pracas
FROM public.user_profiles
ORDER BY created_at DESC;
```

### Promover Usuário para Admin

```sql
UPDATE public.user_profiles
SET is_admin = TRUE
WHERE email = 'usuario@email.com';
```

### Revogar Admin

```sql
UPDATE public.user_profiles
SET is_admin = FALSE
WHERE email = 'usuario@email.com';
```

### Aprovar Usuário Manualmente

```sql
UPDATE public.user_profiles
SET 
  is_approved = TRUE,
  assigned_pracas = ARRAY['SAO PAULO', 'RIO DE JANEIRO'],
  approved_at = NOW()
WHERE email = 'usuario@email.com';
```

### Ver Usuários Pendentes

```sql
SELECT * FROM public.list_pending_users();
```

### Deletar Usuário (cuidado!)

```sql
-- Isto também deleta do auth.users devido ao CASCADE
DELETE FROM public.user_profiles WHERE email = 'usuario@email.com';
```

---

## 🛡️ Segurança

### O que foi implementado:

✅ **Row Level Security (RLS)**: Políticas no nível do banco  
✅ **SECURITY DEFINER**: Funções seguras que não expõem dados  
✅ **Trigger automático**: Perfil criado automaticamente no cadastro  
✅ **Verificação de aprovação**: No login e em toda requisição  
✅ **Filtros por praça**: Automáticos e forçados pelo banco  

### O que você NÃO DEVE fazer:

❌ Desabilitar RLS nas tabelas  
❌ Dar permissão de ADMIN para qualquer um  
❌ Expor credenciais do Supabase no frontend (use apenas ANON KEY)  

---

## 🆘 Problemas Comuns

### ❌ "Sua conta ainda não foi aprovada"

**Solução**: Admin precisa aprovar em `/admin` ou via SQL:

```sql
UPDATE public.user_profiles
SET is_approved = TRUE, assigned_pracas = ARRAY['NOME_DA_PRACA']
WHERE email = 'email@do.usuario';
```

### ❌ "Acesso negado: apenas administradores"

**Solução**: Você não é admin. Peça para um admin promover você:

```sql
UPDATE public.user_profiles
SET is_admin = TRUE
WHERE email = 'seu@email.com';
```

### ❌ "Erro ao carregar perfil do usuário"

**Solução**: Verifique se a função RPC existe:

```sql
SELECT * FROM pg_proc WHERE proname = 'get_current_user_profile';
```

Se não existir, execute o script `auth_setup.sql` novamente.

### ❌ Não consigo ver nenhum dado no dashboard

**Solução**: Verifique suas praças designadas:

```sql
SELECT assigned_pracas FROM public.user_profiles WHERE email = 'seu@email.com';
```

Se estiver vazio ou NULL, peça para um admin atribuir praças.

---

## 📧 Desabilitar Confirmação de Email (Opcional)

Por padrão, o Supabase exige confirmação de email. Para desabilitar (apenas em dev/teste):

1. Vá no **Supabase Dashboard**
2. **Authentication** → **Settings**
3. **Email Auth** → Desmarque **"Enable email confirmations"**
4. Salve

⚠️ **NÃO faça isso em produção!**

---

## 🚀 Próximos Passos

Após configurar autenticação, considere:

1. **Configurar Emails**: Templates de confirmação e recuperação de senha
2. **2FA**: Autenticação de dois fatores para admins
3. **Logs de Auditoria**: Registrar quem aprovou quem
4. **Notificações**: Email automático quando conta for aprovada
5. **Auto-expiração**: Contas inativas por X dias são desativadas

---

## 🎯 Arquitetura do Sistema

```
┌──────────────┐
│   Usuário    │
│  se cadastra │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│  Supabase Auth      │ ← Cria usuário
│  (auth.users)       │
└──────┬──────────────┘
       │ (Trigger automático)
       ▼
┌─────────────────────┐
│  user_profiles      │ ← Perfil com is_approved=false
│  (public)           │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Admin aprova       │ ← Seta is_approved=true
│  via /admin         │    + assigned_pracas
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Usuário faz login  │ ← Verificação de is_approved
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  RLS filtra dados   │ ← Apenas praças permitidas
│  automaticamente    │
└─────────────────────┘
```

Tudo automatizado e seguro! 🔒
