# 🔍 Guia de Verificação - Funções RPC no Supabase

## ✅ Checklist de Funções Necessárias

### 1. **dashboard_resumo** ✓
**Localização:** `ADICIONAR_FILTRO_TURNO.sql`
```sql
dashboard_resumo(
  p_ano INTEGER,
  p_semana INTEGER,
  p_praca TEXT,
  p_sub_praca TEXT,
  p_origem TEXT,
  p_turno TEXT
)
```
**Status:** ✅ Deve estar funcionando (usada no carregamento inicial)

---

### 2. **listar_entregadores** ⚠️
**Localização:** `ADICIONAR_FILTRO_TURNO.sql` (linhas 385-478)
```sql
listar_entregadores(
  p_ano INTEGER DEFAULT NULL,
  p_semana INTEGER DEFAULT NULL,
  p_praca TEXT DEFAULT NULL,
  p_sub_praca TEXT DEFAULT NULL,
  p_origem TEXT DEFAULT NULL,
  p_turno TEXT DEFAULT NULL
)
```
**Retorno:** JSONB com estrutura:
```json
{
  "entregadores": [
    {
      "id_entregador": "xxx",
      "nome_entregador": "xxx",
      "corridas_ofertadas": 0,
      "corridas_aceitas": 0,
      "corridas_rejeitadas": 0,
      "corridas_completadas": 0,
      "total_segundos_trabalhados": 0,
      "total_segundos_planejados": 0,
      "aderencia_percentual": 0,
      "rejeicao_percentual": 0
    }
  ]
}
```
**Status:** ⚠️ Erro 500 - Verifique se a função está criada corretamente

---

### 3. **listar_valores_entregadores** ⚠️
**Localização:** `ADICIONAR_FILTRO_TURNO.sql` (linhas 483+)
```sql
listar_valores_entregadores(
  p_ano INTEGER DEFAULT NULL,
  p_semana INTEGER DEFAULT NULL,
  p_praca TEXT DEFAULT NULL,
  p_sub_praca TEXT DEFAULT NULL,
  p_origem TEXT DEFAULT NULL,
  p_turno TEXT DEFAULT NULL
)
```
**Retorno:** JSONB (array de entregadores com valores)
**Status:** ⚠️ Erro 500 - Verifique se a função está criada corretamente

---

### 4. **listar_evolucao_mensal** ❌
**Localização:** `ATUALIZAR_EVOLUCAO_COMPLETA.sql` (linhas 9-85)
```sql
listar_evolucao_mensal(
  p_praca TEXT DEFAULT NULL,
  p_ano INTEGER DEFAULT NULL
)
```
**Retorno:** TABLE com colunas:
- ano INTEGER
- mes INTEGER
- mes_nome TEXT
- corridas_ofertadas BIGINT
- corridas_aceitas BIGINT
- corridas_completadas BIGINT
- corridas_rejeitadas BIGINT
- total_segundos NUMERIC

**Status:** ❌ Erro 404 - **FUNÇÃO NÃO EXISTE NO BANCO**

---

### 5. **listar_evolucao_semanal** ❌
**Localização:** `ATUALIZAR_EVOLUCAO_COMPLETA.sql` (linhas 88-150)
```sql
listar_evolucao_semanal(
  p_praca TEXT DEFAULT NULL,
  p_ano INTEGER DEFAULT NULL,
  p_limite_semanas INTEGER DEFAULT 53
)
```
**Retorno:** TABLE com colunas:
- ano INTEGER
- semana INTEGER
- semana_label TEXT
- corridas_ofertadas BIGINT
- corridas_aceitas BIGINT
- corridas_completadas BIGINT
- corridas_rejeitadas BIGINT
- total_segundos NUMERIC

**Status:** ❌ Erro 404 - **FUNÇÃO NÃO EXISTE NO BANCO**

---

### 6. **listar_utr_semanal** ❌
**Localização:** `LISTAR_UTR_SEMANAL.sql`
```sql
listar_utr_semanal(
  p_ano INTEGER DEFAULT NULL,
  p_praca TEXT DEFAULT NULL,
  p_limite_semanas INTEGER DEFAULT 53
)
```
**Retorno:** TABLE com colunas:
- ano INTEGER
- semana INTEGER
- semana_label TEXT
- tempo_horas NUMERIC
- total_corridas BIGINT
- utr NUMERIC

**Status:** ❌ Erro 400/404 - **FUNÇÃO NÃO EXISTE OU ASSINATURA INCORRETA**

---

### 7. **calcular_utr** ✓
```sql
calcular_utr(
  p_ano INTEGER,
  p_semana INTEGER,
  p_praca TEXT,
  p_sub_praca TEXT,
  p_origem TEXT,
  p_turno TEXT
)
```
**Status:** ✅ Deve estar funcionando (usada na aba UTR)

---

### 8. **get_current_user_profile** ✓
```sql
get_current_user_profile()
```
**Status:** ✅ Deve estar funcionando (busca perfil do usuário)

---

### 9. **listar_todas_semanas** ✓
```sql
listar_todas_semanas()
```
**Status:** ✅ Deve estar funcionando (popula filtro de semanas)

---

## 🛠️ Como Verificar no Supabase

### Passo 1: Acessar o SQL Editor
1. Acesse seu projeto no Supabase
2. Vá em **SQL Editor** no menu lateral

### Passo 2: Verificar Funções Existentes
Execute este comando para listar todas as funções:

```sql
SELECT 
  routine_name AS function_name,
  routine_type,
  data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'listar%'
ORDER BY routine_name;
```

### Passo 3: Verificar Assinatura Específica
Para cada função, verifique os parâmetros:

```sql
SELECT 
  routine_name,
  parameter_name,
  data_type,
  parameter_mode
FROM information_schema.parameters
WHERE specific_schema = 'public'
  AND routine_name IN (
    'listar_entregadores',
    'listar_valores_entregadores',
    'listar_evolucao_mensal',
    'listar_evolucao_semanal',
    'listar_utr_semanal'
  )
ORDER BY routine_name, ordinal_position;
```

---

## 🔧 Scripts de Correção

### Para criar as funções faltantes:

#### 1. Evolução (Mensal e Semanal)
Execute o arquivo completo:
```sql
-- Cole todo o conteúdo de ATUALIZAR_EVOLUCAO_COMPLETA.sql
```

#### 2. UTR Semanal
Execute o arquivo completo:
```sql
-- Cole todo o conteúdo de LISTAR_UTR_SEMANAL.sql
```

#### 3. Verificar/Recriar listar_entregadores e listar_valores_entregadores
Execute as seções relevantes de:
```sql
-- ADICIONAR_FILTRO_TURNO.sql (linhas 385 em diante)
```

---

## 🚨 Erros Comuns e Soluções

### Erro 404: Function not found
**Causa:** A função não existe no banco
**Solução:** Execute o script SQL que cria a função

### Erro 500: Internal Server Error
**Causa:** Erro na execução da função (SQL incorreto, permissões, etc.)
**Solução:** 
1. Verifique os logs do Supabase
2. Teste a função manualmente no SQL Editor
3. Verifique se as dependências (como `hhmmss_to_seconds`) existem

### Erro 400: Bad Request
**Causa:** Parâmetros incorretos ou assinatura da função não corresponde
**Solução:** Verifique se os parâmetros passados correspondem à assinatura da função

---

## ✅ Teste Rápido

Execute estes comandos no SQL Editor para testar:

```sql
-- Teste 1: Evolução Mensal
SELECT * FROM listar_evolucao_mensal(NULL, 2024) LIMIT 5;

-- Teste 2: Evolução Semanal
SELECT * FROM listar_evolucao_semanal(NULL, 2024, 10) LIMIT 5;

-- Teste 3: UTR Semanal
SELECT * FROM listar_utr_semanal(2024, NULL, 10) LIMIT 5;

-- Teste 4: Entregadores
SELECT listar_entregadores(2024, 1, NULL, NULL, NULL, NULL);

-- Teste 5: Valores
SELECT listar_valores_entregadores(2024, 1, NULL, NULL, NULL, NULL);
```

Se algum teste falhar, você saberá exatamente qual função precisa ser criada/corrigida.

---

## 📋 Ordem de Execução Recomendada

1. ✅ **Primeiro:** Execute `ATUALIZAR_EVOLUCAO_COMPLETA.sql`
2. ✅ **Segundo:** Execute `LISTAR_UTR_SEMANAL.sql`
3. ✅ **Terceiro:** Verifique `ADICIONAR_FILTRO_TURNO.sql` (última versão com suporte a turno)
4. ✅ **Quarto:** Execute os testes acima
5. ✅ **Quinto:** Recarregue o dashboard no navegador

---

## 💡 Dica

Se você não tiver certeza de qual script executar, procure pelo mais recente:
- `ADICIONAR_FILTRO_TURNO.sql` parece ser o mais completo e recente
- Ele já inclui `listar_entregadores` e `listar_valores_entregadores` com suporte a `p_turno`

Execute-o por completo e depois execute os scripts específicos de evolução!

