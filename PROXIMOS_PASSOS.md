# 📋 PRÓXIMOS PASSOS - Implementações Pendentes

## ✅ JÁ FEITO:
1. ✅ Aumentado tempo de redirecionamento para 10s
2. ✅ Corrigido erro "is_admin ambiguous"
3. ✅ Criada função `list_pracas_disponiveis()`
4. ✅ Criado `GUIA_COMPLETO_SQL.md` com todos os SQLs
5. ✅ Começado implementação do filtro por praça

---

## 🔧 PENDENTE - Execute na Ordem:

### **PASSO 1: Execute o SQL de Correção do RLS**

**Arquivo:** `fix_rls_praca_filter.sql`

Execute no Supabase SQL Editor:
- Corrige as políticas RLS para filtrar corretamente por praça
- Usuários não-admin só verão dados de suas praças atribuídas

---

### **PASSO 2: Funcionalidades Admin (Aguardar Deploy)**

**Precisamos adicionar:**

1. **Editar Praças de Usuário Já Aprovado**
   - Botão "Editar" na tabela de usuários
   - Modal para selecionar/desselecionar praças
   - Usa função `update_user_pracas()`

2. **Promover Usuário para Admin**
   - Checkbox na tabela de usuários
   - Botão "Tornar Admin"
   - Nova função SQL:
   ```sql
   CREATE OR REPLACE FUNCTION public.set_user_admin(user_id UUID, make_admin BOOLEAN)
   RETURNS BOOLEAN
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM public.user_profiles up
       WHERE up.id = auth.uid() AND up.is_admin = TRUE
     ) THEN
       RAISE EXCEPTION 'Acesso negado: apenas administradores';
     END IF;

     UPDATE public.user_profiles
     SET is_admin = make_admin
     WHERE id = user_id;

     RETURN TRUE;
   END;
   $$;
   ```

---

### **PASSO 3: Favicon**

**Você mandou uma imagem do app "GO Itaim"**

Preciso que você:
1. Salve a imagem como `favicon.ico` (16x16 ou 32x32 pixels)
2. Coloque em `public/favicon.ico`

Ou me diga se quer que eu crie um favicon baseado no emoji 📊

---

### **PASSO 4: Filtros Dinâmicos para Usuário Não-Admin**

**Frontend precisa:**
- Filtro de Praça: disabled (bloqueado com a praça atribuída)
- Filtros de Sub-Praça e Origem: só mostrar valores da praça atribuída

**Modificações necessárias:**
```typescript
// Em src/app/page.tsx

// Filtrar opções com base nas praças do usuário
const filteredSubPracas = useMemo(() => {
  if (!currentUser || currentUser.is_admin) return subPracas;
  // Buscar apenas sub-praças das praças atribuídas
  return subPracas; // Precisa implementar filtro no backend
}, [currentUser, subPracas]);
```

---

## 📊 TESTES NECESSÁRIOS:

### **Teste 1: Filtro por Praça**
1. Como admin, veja todas as praças
2. Como usuário com GUARULHOS, veja só GUARULHOS
3. Tente mudar o filtro de praça (deve estar bloqueado para não-admin)

### **Teste 2: Editar Praças**
1. Como admin, vá em `/admin`
2. Clique em um usuário aprovado
3. Adicione/remova praças
4. Salve e verifique se atualizou

### **Teste 3: Promover Admin**
1. Como admin, vá em `/admin`
2. Selecione um usuário comum
3. Clique em "Tornar Admin"
4. Faça logout e login com esse usuário
5. Veja se ele agora vê o botão "Admin" e "Upload"

---

## 🎯 PRIORIDADES:

1. **URGENTE:** Execute `fix_rls_praca_filter.sql` no Supabase
2. **IMPORTANTE:** Aguarde deploy e teste filtro por praça
3. **MÉDIO:** Adicione funcionalidade de editar praças
4. **BAIXO:** Adicione favicon
5. **BAIXO:** Promover usuários para admin

---

## 📝 NOTAS:

- O `GUIA_COMPLETO_SQL.md` tem TODOS os SQLs para recuperação
- Se algo quebrar, use o guia para recriar tudo
- Backup regular via Supabase Dashboard → Database → Backups

---

**COMECE PELO PASSO 1!** Execute o `fix_rls_praca_filter.sql` e me avise o resultado.
