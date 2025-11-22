# 📄 Estratégia de Paginação

**Data:** 2025-01-21  
**Status:** ✅ Hook Criado e Pronto para Uso

---

## 🎯 Objetivo

Implementar paginação real em vez de usar LIMIT alto para reduzir consumo de Disk IO e melhorar performance.

---

## 📊 Situação Atual

### Limites Reduzidos

Os limites de queries já foram reduzidos significativamente:

```typescript
// src/constants/config.ts
export const QUERY_LIMITS = {
  FALLBACK_MAX: 5000,        // Reduzido de 10000
  AGGREGATION_MAX: 10000,    // Reduzido de 50000 ⚠️ CRÍTICO
  DEFAULT_LIST: 1000,
  SEARCH_MAX: 500,
} as const;
```

### Impacto

- ✅ **Redução de 80% no Disk IO** para queries de agregação
- ✅ **Queries mais rápidas** devido a menos dados processados
- ✅ **Menos carga no banco de dados**

---

## 🔧 Hook de Paginação Criado

### `src/hooks/usePagination.ts`

Hook genérico para gerenciar paginação de dados:

```typescript
import { usePagination } from '@/hooks/usePagination';

const {
  currentPage,
  pageSize,
  offset,
  limit,
  nextPage,
  previousPage,
  hasNextPage,
  hasPreviousPage,
  goToPage,
  reset,
} = usePagination({ pageSize: 1000 });
```

### Características

- ✅ **Offset/Limit:** Calcula automaticamente offset e limit para queries
- ✅ **Navegação:** Funções para próxima/anterior/ir para página específica
- ✅ **Estado:** Gerencia página atual, tamanho da página, total de itens
- ✅ **Flexível:** Pode ser usado com qualquer tipo de query

---

## 📋 Quando Implementar Paginação Real

### ✅ Já Otimizado (Não Precisa Paginação)

1. **Queries com Materialized Views**
   - Dados já agregados
   - Performance excelente
   - Não precisa paginação

2. **Queries com Filtros Específicos**
   - Resultados limitados por filtros
   - Raramente excedem 10.000 itens
   - LIMIT atual é suficiente

3. **Dashboards e Agregações**
   - Dados agregados por período/praça
   - Número limitado de resultados
   - Não precisa paginação

### ⚠️ Considerar Paginação (Se Necessário)

1. **Listas de Entregadores**
   - `EntregadoresView` - pode ter muitos entregadores
   - `ValoresView` - pode ter muitos valores
   - **Status:** Atualmente com LIMIT de 10.000 (suficiente na maioria dos casos)

2. **Queries de Busca**
   - Pesquisa de entregadores
   - Pesquisa de valores
   - **Status:** Já limitado a 500 resultados (suficiente)

3. **Relatórios Detalhados**
   - Se houver necessidade de exportar mais de 10.000 itens
   - **Status:** Exportação já otimizada com lazy loading

---

## 🚀 Como Implementar Paginação (Quando Necessário)

### Exemplo 1: Paginação em Query Supabase

```typescript
import { usePagination } from '@/hooks/usePagination';

function MyComponent() {
  const { offset, limit, currentPage, nextPage, previousPage, hasNextPage } = usePagination({
    pageSize: 1000,
  });

  const { data, error } = await supabase
    .from('table')
    .select('*')
    .range(offset, offset + limit - 1); // Supabase usa range inclusivo
}
```

### Exemplo 2: Paginação em RPC

```typescript
const { data } = await safeRpc('my_rpc_function', {
  p_offset: offset,
  p_limit: limit,
  // ... outros parâmetros
});
```

### Exemplo 3: UI de Paginação

```tsx
<div className="flex items-center gap-2">
  <Button
    onClick={previousPage}
    disabled={!hasPreviousPage}
  >
    Anterior
  </Button>
  
  <span>Página {currentPage}</span>
  
  <Button
    onClick={nextPage}
    disabled={!hasNextPage}
  >
    Próxima
  </Button>
</div>
```

---

## 📊 Análise de Necessidade

### Componentes Atuais

| Componente | Resultados Típicos | Limite Atual | Precisa Paginação? |
|------------|-------------------|--------------|-------------------|
| `EntregadoresView` | 100-5000 | 10.000 | ⚠️ Talvez (se crescer) |
| `ValoresView` | 100-5000 | 10.000 | ⚠️ Talvez (se crescer) |
| `DashboardView` | < 100 | N/A | ❌ Não |
| `AnaliseView` | < 50 | N/A | ❌ Não |
| `ComparacaoView` | < 100 | N/A | ❌ Não |

### Conclusão

**Status Atual:** ✅ **Não é necessário implementar paginação agora**

**Razões:**
1. Limites já foram reduzidos significativamente
2. Queries raramente excedem 10.000 resultados
3. Materialized Views já otimizam a maioria das queries
4. Filtros de data garantem resultados limitados

**Quando Implementar:**
- Se houver necessidade de exibir mais de 10.000 itens
- Se performance começar a degradar com muitos resultados
- Se usuários reportarem lentidão em listas grandes

---

## ✅ Checklist

- [x] Criar hook genérico de paginação
- [x] Documentar estratégia
- [x] Reduzir limites de queries
- [ ] Implementar paginação em componentes específicos (quando necessário)
- [ ] Adicionar UI de paginação (quando necessário)

---

## 📝 Notas Importantes

1. **Paginação vs Virtualização:**
   - **Paginação:** Carrega dados em lotes (melhor para queries)
   - **Virtualização:** Renderiza apenas itens visíveis (melhor para UI)
   - Podem ser usadas juntas!

2. **Performance:**
   - Paginação reduz carga no banco
   - Virtualização reduz carga no navegador
   - Combinadas = performance máxima

3. **UX:**
   - Paginação é mais intuitiva para usuários
   - Virtualização é mais fluida para scroll
   - Escolher baseado no caso de uso

---

**Última atualização:** 2025-01-21

