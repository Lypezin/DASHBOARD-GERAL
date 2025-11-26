# 📊 Documentação Técnica Completa - Dashboard Operacional

> **Versão**: 1.0  
> **Última Atualização**: 26/11/2025  
> **Autor**: Sistema de Análise Operacional

---

## 📋 Índice

1. [Visão Geral do Sistema](#-visão-geral-do-sistema)
2. [Arquitetura de Dados](#-arquitetura-de-dados)
3. [Sistema de Filtros](#-sistema-de-filtros)
4. [Guias do Dashboard](#-guias-do-dashboard)
5. [RPCs e Funções](#-rpcs-e-funções)
6. [Índices do Banco de Dados](#-índices-do-banco-de-dados)
7. [Fluxo de Dados](#-fluxo-de-dados)
8. [Troubleshooting](#-troubleshooting)

---

## 🎯 Visão Geral do Sistema

O **Dashboard Operacional** é um sistema de análise de métricas operacionais com foco em:
- **Aderência de corridas** por turno, praça, sub-praça, origem
- **UTR (Utilization Time Rate)** - taxa de utilização de tempo
- **Performance de entregadores** e valores gerados
- **Evolução temporal** e comparação entre períodos

### Tecnologias Principais

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Estilização**: Tailwind CSS + Shadcn/ui

---

## 🗄️ Arquitetura de Dados

### Tabelas Principais

#### `dados_corridas`
Tabela principal com dados brutos de corridas e entregadores.

**Colunas Importantes**:
```sql
id                                              bigint (PK)
data_do_periodo                                 date
periodo                                         text (turno)
pessoa_entregadora                              text
praca                                           text (cidade)
sub_praca                                       text
origem                                          text (loja/restaurante)
tempo_disponivel_absoluto_segundos              numeric
numero_de_corridas_ofertadas                    integer
numero_de_corridas_aceitas                      integer
numero_de_corridas_rejeitadas                   integer
numero_de_corridas_completadas                  integer
soma_das_taxas_das_corridas_aceitas             numeric (em centavos!)
ano_iso                                         integer
semana_numero                                   integer
dia_iso                                         integer
organization_id                                 uuid
```

**⚠️ IMPORTANTE**: 
- `soma_das_taxas_das_corridas_aceitas` está em **CENTAVOS** - sempre dividir por 100!
- `ano_iso` e `semana_numero` usam padrão ISO (semana começa segunda-feira)

#### `mv_dashboard_resumo`
Materialized View agregada para performance.

**Estrutura**:
```sql
ano_iso                     integer
semana_iso                  integer
data_do_periodo            date
turno                      text
praca                      text
sub_praca                  text
origem                     text
horas_a_entregar           interval
horas_entregues            interval
corridas_ofertadas         bigint
corridas_aceitas           bigint
corridas_rejeitadas        bigint
corridas_completadas       bigint
aderencia_percentual       numeric
```

**Refresh**: Precisa ser atualizada manualmente ou via trigger quando dados mudarem.

#### `user_profiles`
Perfis de usuários com permissões.

**Colunas**:
```sql
id                  uuid (PK, FK -> auth.users)
email               text
full_name           text
organization_id     uuid
role                text ('admin', 'usuario', 'marketing')
is_admin            boolean
is_approved         boolean
assigned_pracas     text[] (cidades que o usuário pode ver)
```

#### `organizations`
Organizações/empresas do sistema.

---

## 🎛️ Sistema de Filtros

### Filtros Globais

Todos os filtros são gerenciados centralmente em `useDashboardPage.ts` e passados via `buildFilterPayload()`.

**Filtros Disponíveis**:

```typescript
interface DashboardFilters {
  ano: number | null;              // Ano ISO
  semana: number | null;           // Semana ISO (1-53)
  semanas: number[];               // Múltiplas semanas (conversão para CSV)
  praca: string | null;            // Cidade (ex: "GUARULHOS")
  subPracas: string[];             // Sub-praças (múltiplas)
  origens: string[];               // Lojas/restaurantes (múltiplas)
  turnos: string[];                // Turnos (múltiplos)
  dataInicial: string | null;      // Data início (YYYY-MM-DD)
  dataFinal: string | null;        // Data fim (YYYY-MM-DD)
  filtroModo: 'ano_semana' | 'intervalo_datas';
}
```

### Payload para RPCs

O `buildFilterPayload()` em `src/utils/helpers.ts` converte os filtros em formato aceito pelas funções RPC:

```typescript
interface FilterPayload {
  p_ano: number | null;
  p_semana: number | null;
  p_praca: string | null;
  p_sub_praca: string | null;      // CSV de sub-praças
  p_origem: string | null;         // CSV de origens
  p_turno: string | null;          // CSV de turnos
  p_data_inicial: string | null;
  p_data_final: string | null;
  p_organization_id: string | null;
}
```

### Regras de Filtro

1. **Arrays múltiplos** (subPracas, origens, turnos) são convertidos para CSV: `["A", "B"]` → `"A,B"`
2. **Strings vazias** são convertidas para `null`
3. **"Todas"/"Todos"** são tratadas como `null` (sem filtro)
4. **Admins** (`is_admin: true`) podem ver todas as organizações (`p_organization_id: null`)
5. **Usuários normais** veem apenas sua organização
6. **Marketing** vê todas as cidades, mas apenas sua organização

### Permissões por Praça

```typescript
function hasFullCityAccess(user: CurrentUser): boolean {
  return user.is_admin || user.role === 'admin' || user.role === 'marketing';
}
```

- **Admin**: Acesso total
- **Marketing**: Todas as cidades da sua organização
- **Usuário**: Apenas `assigned_pracas[]`

---

## 📊 Guias do Dashboard

### 1️⃣ Dashboard (Principal)

**Componente**: `src/components/views/DashboardView.tsx`  
**Hook de Dados**: `useDashboardMainData.ts`  
**RPC Utilizado**: `dashboard_resumo`

#### Funcionalidade

Exibe resumo operacional com:
- **Totais Gerais**: Corridas ofertadas, aceitas, rejeitadas, completadas
- **Aderência por Dia**: Gráfico de barras por dia da semana
- **Aderência por Turno**: Performance por período do dia
- **Aderência por Sub-Praça**: Ranking de localidades
- **Aderência por Origem**: Top lojas/restaurantes

#### Dados Retornados (dashboard_resumo)

```typescript
interface DashboardResumoData {
  totais: {
    corridas_ofertadas: number;
    corridas_aceitas: number;
    corridas_rejeitadas: number;
    corridas_completadas: number;
  };
  semanal: AderenciaSemanal[];
  dia: AderenciaDia[];           // Usa campo 'data' (YYYY-MM-DD)
  turno: AderenciaTurno[];       // Usa campo 'turno'
  sub_praca: AderenciaSubPraca[];
  origem: AderenciaOrigem[];
  dimensoes: {
    anos: number[];
    pracas: string[];
    sub_pracas: string[];
    origens: string[];
    turnos: string[];
    semanas: string;
  };
}
```

#### Transformação de Dados

**Arquivo**: `src/utils/dashboard/transformers.ts`

**Ponto de Atenção**:
```typescript
// ✅ Campo correto vindo do RPC
dia: [{
  data: "2025-01-13",           // ISO date string
  horas_entregues: "123:45:00",
  corridas_aceitas: 150,
  // ...
}]

// ❌ Campos antigos (NÃO USAR)
// dia_da_semana, dia_iso - calculados no frontend a partir de 'data'
```

#### Índices Utilizados

```sql
-- Para queries por ano/semana
idx_dashboard_resumo_ano_semana
  ON mv_dashboard_resumo (ano_iso, semana_iso)

-- Para aggregations
idx_dashboard_resumo_turno
  ON mv_dashboard_resumo (turno)
  
idx_dashboard_resumo_sub_praca
  ON mv_dashboard_resumo (sub_praca)
```

---

### 2️⃣ Análise

**Componente**: `src/components/views/AnaliseView.tsx`  
**Hook de Dados**: `useDashboardMainData.ts` (reutiliza dados do Dashboard)  
**RPC Utilizado**: `dashboard_resumo` (mesmo do Dashboard)

#### Funcionalidade

Visão detalhada com tabelas expandidas:
- **Análise Diária Completa**: Tabela com todas as métricas por dia
- **Análise por Turno**: Detalhamento de cada período
- **Análise por Sub-Praça**: Performance completa de cada localidade
- **Análise por Origem**: Métricas por loja/restaurante

#### Diferença para Dashboard

- **Dashboard**: Visualização em gráficos e cards resumidos
- **Análise**: Tabelas detalhadas com mais métricas visíveis
- **Mesma fonte de dados**, apresentação diferente

---

### 3️⃣ UTR (Utilization Time Rate)

**Componente**: `src/components/views/UtrView.tsx`  
**Hook de Dados**: `useTabData.ts` + `fetchUtrData()`  
**RPC Utilizado**: `calcular_utr_completo`

#### Funcionalidade

Calcula taxa de utilização de tempo dos entregadores:

```
UTR = (Tempo em Corrida / Tempo Disponível) × 100
```

Exibe:
- **UTR Geral**: Média global do período
- **UTR por Praça**: Comparação entre cidades
- **UTR por Sub-Praça**: Detalhamento de localidades
- **Gráficos de Evolução**: Timeline de UTR

#### Dados Retornados (calcular_utr_completo)

```typescript
interface UtrData {
  utr_geral: number;              // Percentual global
  utr_por_praca: Array<{
    praca: string;
    utr: number;
    tempo_disponivel: number;     // Em segundos
    tempo_corrida: number;        // Em segundos
  }>;
  utr_por_sub_praca: Array<{
    sub_praca: string;
    utr: number;
    // ...
  }>;
  // Outras dimensões...
}
```

#### Cálculo Interno (RPC)

```sql
SELECT 
  SUM(tempo_em_corrida_segundos) / NULLIF(SUM(tempo_disponivel_absoluto_segundos), 0) * 100 as utr
FROM dados_corridas
WHERE ... (filtros)
```

#### Índices Utilizados

```sql
idx_dados_corridas_utr
  ON dados_corridas (ano_iso, semana_numero)
  INCLUDE (tempo_disponivel_absoluto_segundos, tempo_em_corrida_segundos)
```

---

### 4️⃣ Entregadores

**Componente**: `src/components/views/EntregadoresView.tsx`  
**Hook de Dados**: `useTabData.ts` + `fetchEntregadoresData()`  
**RPC Utilizado**: `listar_entregadores`

#### Funcionalidade

Lista de entregadores com métricas de performance:
- **Nome / ID do Entregador**
- **Corridas Aceitas**
- **Corridas Completadas**
- **Taxa de Conclusão**: `(Completadas / Aceitas) × 100`
- **Tempo Disponível**
- **Pesquisa** por nome ou ID

#### Dados Retornados (listar_entregadores)

```typescript
interface EntregadoresData {
  entregadores: Entregador[];
  total: number;
}

interface Entregador {
  id_entregador: string;
  nome_entregador: string;
  corridas_aceitas: number;
  corridas_completadas: number;
  corridas_rejeitadas: number;
  tempo_disponivel: string;       // HH:MM:SS
  taxa_conclusao: number;         // Percentual
}
```

#### Ordenação

Ordena por `corridas_completadas DESC` por padrão.

#### Índices Utilizados

```sql
idx_dados_corridas_entregadores
  ON dados_corridas (pessoa_entregadora, ano_iso, semana_numero)
  INCLUDE (numero_de_corridas_aceitas, numero_de_corridas_completadas)
```

---

### 5️⃣ Valores

**Componente**: `src/components/views/ValoresView.tsx`  
**Hook de Dados**: `useTabData.ts` + `fetchValoresData()`  
**RPC Utilizado**: `listar_valores_entregadores`

#### Funcionalidade

Valores monetários gerados por entregadores:
- **Total por Entregador**: Soma de taxas de corridas aceitas
- **Quantidade de Corridas**
- **Taxa Média por Corrida**: `Total / Quantidade`
- **Ranking por Valor**: TOP entregadores
- **Pesquisa**: `pesquisar_valores_entregadores`

#### ⚠️ CONVERSÃO CRÍTICA

**Valores estão em CENTAVOS no banco!**

```typescript
// ❌ ERRADO
total_taxas = SUM(soma_das_taxas_das_corridas_aceitas)

// ✅ CORRETO
total_taxas = SUM(soma_das_taxas_das_corridas_aceitas) / 100
```

#### Dados Retornados (listar_valores_entregadores)

```typescript
interface ValoresEntregador {
  nome_entregador: string;
  id_entregador: string;
  total_taxas: number;             // EM REAIS (já dividido por 100)
  numero_corridas_aceitas: number;
  taxa_media: number;              // EM REAIS
}
```

#### RPC - Lógica de Conversão

```sql
SELECT 
  pessoa_entregadora as nome_entregador,
  ROUND((SUM(soma_das_taxas_das_corridas_aceitas) / 100.0), 2) as total_taxas,
  SUM(numero_de_corridas_aceitas) as numero_corridas_aceitas,
  ROUND((SUM(soma_das_taxas_das_corridas_aceitas) / 100.0) / 
        NULLIF(SUM(numero_de_corridas_aceitas), 0), 2) as taxa_media
FROM dados_corridas
GROUP BY pessoa_entregadora
ORDER BY total_taxas DESC
-- SEM LIMIT - mostra TODOS os entregadores
```

#### Pesquisa de Valores

**RPC**: `pesquisar_valores_entregadores(termo_busca text)`

Busca por:
- Nome do entregador (parcial, case-insensitive)
- ID do entregador

```sql
WHERE 
  LOWER(pessoa_entregadora) LIKE LOWER('%' || termo_busca || '%')
  OR id_da_pessoa_entregadora = termo_busca
```

#### Índices Utilizados

```sql
idx_dados_corridas_valores
  ON dados_corridas (pessoa_entregadora, ano_iso, semana_numero)
  INCLUDE (soma_das_taxas_das_corridas_aceitas, numero_de_corridas_aceitas)

idx_dados_pessoa_nome_lower
  ON dados_corridas (LOWER(pessoa_entregadora))
```

---

### 6️⃣ Prioridade/Promo

**Componente**: `src/components/views/PrioridadePromoView.tsx`  
**Hook de Dados**: `useTabData.ts` + `fetchEntregadoresData()`  
**RPC Utilizado**: `listar_entregadores` (mesmo da guia Entregadores)

#### Funcionalidade

Reutiliza dados de entregadores com visualização focada em:
- **Priorização** de entregadores por performance
- **Promoção** de entregadores de alto desempenho
- **Filtros adicionais** por critérios específicos

#### Diferença para Entregadores

- **Mesma fonte de dados**
- **Apresentação**: Cards com destaque visual
- **Filtros**: Foco em critérios de priorização

---

### 7️⃣ Evolução

**Componente**: `src/components/views/EvolucaoView.tsx`  
**Hook de Dados**: `useDashboardEvolucao.ts`  
**RPC Utilizado**: `dashboard_resumo` (múltiplas chamadas)

#### Funcionalidade

Compara evolução temporal de métricas:
- **Seleção de Ano Base**: Ano de comparação
- **Gráfico de Linhas**: Evolução semana a semana
- **Comparação**: Ano atual vs. ano anterior
- **Métricas**: Aderência, corridas, UTR

#### Lógica de Funcionamento

```typescript
// Buscar dados de TODAS as semanas do ano selecionado
const promises = semanas.map(semana => 
  rpc.dashboard_resumo({
    p_ano: anoSelecionado,
    p_semana: semana,
    // ... outros filtros
  })
);

const resultados = await Promise.all(promises);

// Processar e agrupar por semana
const evolucao = resultados.map((data, index) => ({
  semana: semanas[index],
  aderencia: calcularAderencia(data.totais),
  corridas: data.totais.corridas_aceitas,
  // ...
}));
```

#### Performance

- **Múltiplas chamadas RPC** (1 por semana mostrada)
- **Cache**: Resultados são cachea dos por 30 minutos
- **Otimização**: Usar `Promise.all()` para paralelizar

#### Índices Utilizados

Os mesmos de `dashboard_resumo`:
```sql
idx_dashboard_resumo_ano_semana
idx_dashboard_resumo_turno
```

---

### 8️⃣ Comparar

**Componente**: `src/components/views/CompararView.tsx`  
**Hook de Dados**: `useDashboardComparacao.ts`  
**RPC Utilizado**: `dashboard_resumo` (2-3 chamadas)

#### Funcionalidade

Comparação lado-a-lado de períodos:
- **Seleção de Períodos**: Até 3 períodos simultaneamente
- **Comparação de Métricas**: Todos os KPIs lado a lado
- **Diferenças Percentuais**: Variação entre períodos
- **Gráficos de Barras**: Comparação visual

#### Lógica de Comparação

```typescript
interface PeriodoComparacao {
  id: string;
  ano: number;
  semana: number;
  label: string;              // "Semana 1/2025"
}

// Buscar dados de cada período
const dadosPeriodos = await Promise.all(
  periodos.map(p => 
    rpc.dashboard_resumo({
      p_ano: p.ano,
      p_semana: p.semana,
      // ...
    })
  )
);

// Calcular diferenças
const comparacao = {
  periodo1: dadosPeriodos[0],
  periodo2: dadosPeriodos[1],
  diferenca: {
    corridas: periodo2.corridas - periodo1.corridas,
    percentual: ((periodo2.corridas - periodo1.corridas) / periodo1.corridas) * 100
  }
};
```

---

## 🔧 RPCs e Funções

### Resumo de Todas as Funções

| Função | Parâmetros | Retorno | Usado Por | Security Definer |
|--------|-----------|---------|-----------|-----------------|
| `dashboard_resumo` | p_ano, p_semana, p_praca, p_sub_praca, p_origem, p_turno, p_data_inicial, p_data_final, p_organization_id | `jsonb` | Dashboard, Análise, Evolução, Comparar | ✅ Sim |
| `calcular_utr_completo` | (mesmos de cima) | `jsonb` | UTR | ✅ Sim |
| `listar_entregadores` | p_ano, p_semana, p_praca, p_sub_praca, p_origem, p_data_inicial, p_data_final, p_organization_id | `jsonb` | Entregadores, Prioridade/Promo | ✅ Sim |
| `listar_valores_entregadores` | (mesmos de cima) | `jsonb` | Valores | ✅ Sim |
| `pesquisar_valores_entregadores` | termo_busca | `TABLE` | Valores (busca) | ❌ Não |
| `listar_anos_disponiveis` | - | `jsonb` | Filtros (select ano) | ✅ Sim |
| `listar_todas_semanas` | - | `text[]` | Filtros (select semana) | ✅ Sim |

### Detalhes de Cada RPC

#### `dashboard_resumo`

**Fonte de Dados**: `mv_dashboard_resumo` (materialized view)

**Agregações**:
```sql
SELECT 
  -- Totais
  SUM(corridas_ofertadas) as corridas_ofertadas,
  SUM(corridas_aceitas) as corridas_aceitas,
  SUM(corridas_rejeitadas) as corridas_rejeitadas,
  SUM(corridas_completadas) as corridas_completadas,
  
  -- Por dimensão (dia, turno, sub_praca, origem)
  data_do_periodo,
  turno,
  sub_praca,
  origem,
  SUM(horas_entregues) / NULLIF(SUM(horas_a_entregar), 0) * 100 as aderencia_percentual
FROM mv_dashboard_resumo
WHERE ... (filtros)
GROUP BY ...
```

**RLS (Row Level Security)**:
```sql
-- Política: Users view own org data
(
  current_setting('role') = 'service_role' OR
  organization_id IS NULL OR
  organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid()) OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
)
```

#### `calcular_utr_completo`

**Fonte de Dados**: `dados_corridas` (tabela principal)

**Cálculo de UTR**:
```sql
WITH utr_calc AS (
  SELECT 
    praca,
    sub_praca,
    SUM(tempo_disponivel_absoluto_segundos) as tempo_disponivel,
    SUM(tempo_em_corrida_segundos) as tempo_corrida,
    CASE 
      WHEN SUM(tempo_disponivel_absoluto_segundos) > 0 
      THEN (SUM(tempo_em_corrida_segundos)::numeric / 
            SUM(tempo_disponivel_absoluto_segundos) * 100)
      ELSE 0 
    END as utr
  FROM dados_corridas
  WHERE ... (filtros)
  GROUP BY praca, sub_praca
)
SELECT * FROM utr_calc
ORDER BY utr DESC
```

#### `listar_entregadores`

**Fonte de Dados**: `dados_corridas`

**Agregação por Entregador**:
```sql
SELECT 
  pessoa_entregadora as nome_entregador,
  id_da_pessoa_entregadora as id_entregador,
  SUM(numero_de_corridas_aceitas) as corridas_aceitas,
  SUM(numero_de_corridas_completadas) as corridas_completadas,
  SUM(numero_de_corridas_rejeitadas) as corridas_rejeitadas,
  SUM(tempo_disponivel_absoluto_segundos) as tempo_disponivel_segundos,
  CASE 
    WHEN SUM(numero_de_corridas_aceitas) > 0 
    THEN (SUM(numero_de_corridas_completadas)::numeric / 
          SUM(numero_de_corridas_aceitas) * 100)
    ELSE 0 
  END as taxa_conclusao
FROM dados_corridas
WHERE pessoa_entregadora IS NOT NULL
  AND ... (filtros)
GROUP BY pessoa_entregadora, id_da_pessoa_entregadora
ORDER BY corridas_completadas DESC
```

#### `listar_valores_entregadores`

**⚠️ ATENÇÃO**: Valores em CENTAVOS → Divisão por 100!

```sql
SELECT 
  pessoa_entregadora as nome_entregador,
  pessoa_entregadora as id_entregador,
  ROUND((SUM(soma_das_taxas_das_corridas_aceitas) / 100.0), 2) as total_taxas,
  SUM(numero_de_corridas_aceitas) as numero_corridas_aceitas,
  CASE 
    WHEN SUM(numero_de_corridas_aceitas) > 0 
    THEN ROUND((SUM(soma_das_taxas_das_corridas_aceitas) / 100.0) / 
               SUM(numero_de_corridas_aceitas), 2)
    ELSE 0 
  END as taxa_media
FROM dados_corridas
WHERE pessoa_entregadora IS NOT NULL
  AND ... (filtros)
GROUP BY pessoa_entregadora
ORDER BY total_taxas DESC
-- SEM LIMIT - mostra todos
```

**Normalização de Filtros**:
```sql
-- Trata "Todas", "Todos", "all" como NULL
v_praca := CASE 
  WHEN p_praca IS NULL OR TRIM(p_praca) = '' 
    OR LOWER(TRIM(p_praca)) IN ('todas', 'todos', 'all') 
  THEN NULL 
  ELSE p_praca 
END;
```

#### `listar_anos_disponiveis`

```sql
SELECT DISTINCT ano_iso 
FROM dados_corridas 
WHERE ano_iso IS NOT NULL 
ORDER BY ano_iso DESC
```

Retorna: `[2025, 2024, 2023, ...]`

#### `listar_todas_semanas`

```sql
SELECT DISTINCT semana_numero::text
FROM dados_corridas
WHERE semana_numero IS NOT NULL
ORDER BY semana_numero
```

Retorna: `["1", "2", "3", ..., "53"]`

---

## 🗂️ Índices do Banco de Dados

### Índices Críticos para Performance

#### `dados_corridas`

```sql
-- 1. Índice principal para queries de ano/semana
CREATE INDEX idx_dados_corridas_ano_semana 
ON dados_corridas (ano_iso, semana_numero)
WHERE ano_iso IS NOT NULL AND semana_numero IS NOT NULL;

-- 2. Índice otimizado para admins (cobre WHERE + SELECT)
CREATE INDEX idx_dados_corridas_admin_optimized 
ON dados_corridas (praca, ano_iso, semana_numero)
INCLUDE (
  tempo_disponivel_absoluto_segundos,
  numero_de_corridas_ofertadas,
  numero_de_corridas_aceitas,
  numero_de_corridas_rejeitadas,
  numero_de_corridas_completadas
);

-- 3. Índice para filtros de data
CREATE INDEX idx_dados_corridas_data_periodo_filtros
ON dados_corridas (data_do_periodo, praca, sub_praca)
WHERE data_do_periodo IS NOT NULL;

-- 4. Índice para queries por entregador
CREATE INDEX idx_dados_corridas_entregadores
ON dados_corridas (pessoa_entregadora, ano_iso, semana_numero)
INCLUDE (numero_de_corridas_aceitas, numero_de_corridas_completadas);

-- 5. Índice para valores (taxas)
CREATE INDEX idx_dados_corridas_valores
ON dados_corridas (pessoa_entregadora, ano_iso, semana_numero)
INCLUDE (soma_das_taxas_das_corridas_aceitas, numero_de_corridas_aceitas);

-- 6. Índice para pesquisa de entregadores por nome
CREATE INDEX idx_dados_pessoa_nome_lower
ON dados_corridas (LOWER(pessoa_entregadora));

-- 7. Índice para organização (RLS)
CREATE INDEX idx_dados_corridas_organization
ON dados_corridas (organization_id)
WHERE organization_id IS NOT NULL;

-- 8. Índice para UTR
CREATE INDEX idx_dados_corridas_utr
ON dados_corridas (ano_iso, semana_numero)
INCLUDE (tempo_disponivel_absoluto_segundos, tempo_em_corrida_segundos);
```

#### `mv_dashboard_resumo`

```sql
-- 1. Índice principal para ano/semana
CREATE INDEX idx_dashboard_resumo_ano_semana
ON mv_dashboard_resumo (ano_iso, semana_iso)
WHERE ano_iso IS NOT NULL AND semana_iso IS NOT NULL;

-- 2. Índices para cada dimensão de agregação
CREATE INDEX idx_dashboard_resumo_turno
ON mv_dashboard_resumo (turno)
WHERE turno IS NOT NULL;

CREATE INDEX idx_dashboard_resumo_sub_praca
ON mv_dashboard_resumo (sub_praca)
WHERE sub_praca IS NOT NULL;

CREATE INDEX idx_dashboard_resumo_origem
ON mv_dashboard_resumo (origem)
WHERE origem IS NOT NULL;

-- 3. Índice composto para queries complexas
CREATE INDEX idx_dashboard_resumo_completo
ON mv_dashboard_resumo (ano_iso, semana_iso, praca, turno)
INCLUDE (corridas_aceitas, corridas_ofertadas, aderencia_percentual);
```

#### `user_profiles`

```sql
-- 1. Índice por email (autenticação)
CREATE INDEX idx_user_profiles_email
ON user_profiles (email);

-- 2. Índice por organização (RLS)
CREATE INDEX idx_user_profiles_organization_id
ON user_profiles (organization_id);

-- 3. Índice para admins
CREATE INDEX idx_user_profiles_admin
ON user_profiles (is_admin);

-- 4. Índice para aprovação
CREATE INDEX idx_user_profiles_is_approved
ON user_profiles (is_approved)
WHERE is_approved = false;
```

### Manutenção de Índices

**Verificar uso de índices**:
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

**Reindexar** (se necessário):
```sql
REINDEX INDEX CONCURRENTLY idx_dados_corridas_ano_semana;
```

**Atualizar estatísticas**:
```sql
ANALYZE dados_corridas;
ANALYZE mv_dashboard_resumo;
```

---

## 🔄 Fluxo de Dados

### Fluxo Completo de uma Query

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │
       │ 1. Usuário muda filtros
       ▼
┌──────────────────┐
│ useDashboardPage │
│  - setFilters()  │
└──────┬───────────┘
       │
       │ 2. buildFilterPayload()
       ▼
┌──────────────────┐
│  FilterPayload   │
│ {p_ano, p_semana}│
└──────┬───────────┘
       │
       │ 3. useTabData() / useDashboardMainData()
       ▼
┌──────────────────┐
│   fetchTabData   │
│  - cache check   │
└──────┬───────────┘
       │
       │ 4. safeRpc() wrapper
       ▼
┌──────────────────┐
│   Supabase RPC   │
│ dashboard_resumo │
└──────┬───────────┘
       │
       │ 5. PostgreSQL query
       ▼
┌──────────────────────┐
│ mv_dashboard_resumo  │
│   + RLS policies     │
└──────┬───────────────┘
       │
       │ 6. Aggregate data
       ▼
┌──────────────────┐
│  JSON Response   │
└──────┬───────────┘
       │
       │ 7. transformDashboardData()
       ▼
┌──────────────────┐
│ Typed Frontend   │
│      Data        │
└──────┬───────────┘
       │
       │ 8. React components render
       ▼
┌─────────────┐
│   UI        │
│  Gráficos   │
│  Tabelas    │
└─────────────┘
```

### Cache Strategy

**Localização**: `src/hooks/useCache.ts`

**TTL por Tipo**:
```typescript
CACHE.TAB_DATA_TTL = 5 * 60 * 1000;        // 5 minutos
CACHE.FILTER_OPTIONS_TTL = 30 * 60 * 1000; // 30 minutos
```

**Cache Key**:
```typescript
const cacheKey = `${tab}-${JSON.stringify(filterPayload)}`;
```

**Invalidação**:
- Mudança de tab
- Mudança de filtros
- TTL expirado
- Hard refresh (Ctrl+Shift+R)

---

## 🐛 Troubleshooting

### Problema: Valores 100x maiores

**Causa**: `soma_das_taxas_das_corridas_aceitas` em centavos

**Solução**:
```sql
-- ✅ SEMPRE dividir por 100
SELECT SUM(soma_das_taxas_das_corridas_aceitas) / 100.0 as total_reais
```

### Problema: Filtros não aplicam

**Diagnóstico**:
1. Verificar console: `🔴 [setFiltersProtected] Arrays de filtros mudaram`
2. Verificar Network tab: payload do RPC
3. Verificar `filtersKey` dependency

**Causas Comuns**:
- `useMemo` sem dependências corretas
- Arrays sendo recriados (referências mudam)
- Strings vazias não convertidas para `null`

**Solução**:
```typescript
// ❌ ERRADO
const payload = { p_praca: praca };

// ✅ CORRETO
const payload = { 
  p_praca: praca === '' ? null : praca 
};
```

### Problema: RLS bloqueia dados

**Verificar política**:
```sql
SELECT * FROM pg_policies WHERE tablename = 'dados_corridas';
```

**Política correta para admins**:
```sql
CREATE POLICY "Users view own org data" ON dados_corridas
FOR SELECT USING (
  current_setting('role') = 'service_role' OR
  organization_id IS NULL OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND (is_admin = true OR role = 'admin')
  ) OR
  organization_id IN (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid()
  )
);
```

### Problema: Materialized View desatualizada

**Refresh manual**:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_resumo;
```

**Configurar trigger** (recomendado):
```sql
CREATE OR REPLACE FUNCTION refresh_dashboard_mv()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_resumo;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_dashboard
AFTER INSERT OR UPDATE OR DELETE ON dados_corridas
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_dashboard_mv();
```

### Problema: Query lenta

**Diagnosticar**:
```sql
EXPLAIN ANALYZE
SELECT * FROM dashboard_resumo(2025, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
```

**Otimizações**:
1. Verificar índices usados: `Index Scan` é bom, `Seq Scan` é ruim
2. Atualizar estatísticas: `ANALYZE dados_corridas;`
3. Adicionar índice específico se necessário
4. Verificar se MV está atualizada

### Problema: Dados inconsistentes

**Verificar**:
```sql
-- 1. Checar totais
SELECT COUNT(*), SUM(numero_de_corridas_aceitas) 
FROM dados_corridas 
WHERE ano_iso = 2025 AND semana_numero = 1;

-- 2. Comparar com MV
SELECT COUNT(*), SUM(corridas_aceitas) 
FROM mv_dashboard_resumo 
WHERE ano_iso = 2025 AND semana_iso = 1;

-- 3. Se diferentes, refresh MV
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_resumo;
```

---

## 📝 Checklist de Deploy

Antes de fazer deploy de mudanças:

- [ ] Testar localmente com dados reais
- [ ] Verificar se índices estão criados
- [ ] Atualizar materialized views se estrutura mudou
- [ ] Testar RLS com diferentes perfis (admin, user, marketing)
- [ ] Verificar conversão de centavos → reais
- [ ] Testar filtros combinados
- [ ] Verificar cache (limpar se necessário)
- [ ] Testar em diferentes navegadores
- [ ] Verificar performance com `EXPLAIN ANALYZE`
- [ ] Backup do banco antes de migrations

---

## 🔐 Segurança

### RLS (Row Level Security)

**Sempre habilitado** em produção:
```sql
ALTER TABLE dados_corridas ENABLE ROW LEVEL SECURITY;
```

### Security Definer

Funções RPC usam `SECURITY DEFINER` para:
- Executar com permissões elevadas
- Aplicar lógica de organização customizada
- Byppassar RLS de forma controlada

**⚠️ CUIDADO**: Sempre validar `p_organization_id` e permissões do usuário dentro da função!

### Proteção contra SQL Injection

✅ **Usar parâmetros**, não concatenação:
```sql
-- ❌ ERRADO
sql := 'SELECT * FROM dados WHERE praca = ' || p_praca;

-- ✅ CORRETO
SELECT * FROM dados WHERE praca = p_praca;
```

---

## 📁 Estrutura do Projeto

### Organização de Diretórios

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (se houver)
│   ├── dashboard/                # Página principal do dashboard
│   └── layout.tsx                # Layout raiz
│
├── components/                   # Componentes React
│   ├── dashboard/                # Componentes específicos do dashboard
│   │   ├── DashboardFiltersContainer.tsx
│   │   ├── DashboardViewsRenderer.tsx
│   │   └── FiltroBar.tsx
│   ├── views/                    # Views principais (guias)
│   │   ├── DashboardView.tsx     # Guia principal
│   │   ├── AnaliseView.tsx
│   │   ├── UtrView.tsx
│   │   ├── EntregadoresView.tsx
│   │   ├── ValoresView.tsx
│   │   ├── PrioridadePromoView.tsx
│   │   ├── EvolucaoView.tsx
│   │   └── CompararView.tsx
│   ├── ui/                       # Componentes UI reutilizáveis (shadcn)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── select.tsx
│   │   └── ...
│   └── FiltroMultiSelect.tsx     # Componente de filtro múltiplo
│
├── hooks/                        # Custom React Hooks
│   ├── useDashboardPage.ts       # Hook principal - gerencia estado do dashboard
│   ├── useDashboardMainData.ts   # Hook para dados do dashboard principal
│   ├── useDashboardEvolucao.ts   # Hook para evolução temporal
│   ├── useDashboardComparacao.ts # Hook para comparação
│   ├── useTabData.ts             # Hook genérico para dados de tabs
│   ├── useTabDataFetcher.ts      # Fetcher com retry logic
│   ├── useTabDataMapper.ts       # Mapeia dados para componentes
│   ├── useCache.ts               # Sistema de cache
│   ├── useAuthGuard.ts           # Proteção de rotas
│   └── useUserActivity.ts        # Tracking de atividade
│
├── lib/                          # Bibliotecas e configurações
│   ├── supabaseClient.ts         # Cliente Supabase configurado
│   ├── errorHandler.ts           # Handler de erros (safeLog)
│   ├── rpcWrapper.ts             # Wrapper para RPCs (safeRpc)
│   └── rpcErrorHandler.ts        # Tratamento de erros de RPC
│
├── types/                        # TypeScript Types
│   ├── dashboard.ts              # Tipos do dashboard
│   ├── filters.ts                # Tipos de filtros
│   ├── rpc.ts                    # Tipos de RPC
│   └── index.ts                  # Exports centralizados
│
├── utils/                        # Funções utilitárias
│   ├── dashboard/
│   │   └── transformers.ts       # Transforma dados do RPC
│   ├── tabData/
│   │   ├── fetchers.ts           # Fetchers por tipo de tab
│   │   └── fallbacks.ts          # Fallbacks quando RPC falha
│   ├── helpers.ts                # buildFilterPayload, etc
│   └── formatters.ts             # Formatação de números, datas
│
└── constants/                    # Constantes do sistema
    ├── config.ts                 # Configurações (timeouts, limits)
    └── routes.ts                 # Rotas da aplicação
```

### Fluxo de Arquivos por Feature

#### Filtros
```
FiltroBar.tsx → useDashboardPage.ts → buildFilterPayload() → RPCs
     ↓
FiltroMultiSelect.tsx
```

#### Dashboard Principal
```
DashboardView.tsx → useDashboardMainData.ts → dashboard_resumo RPC
                                    ↓
                          transformDashboardData()
```

#### Outras Tabs
```
ValoresView.tsx → useTabData.ts → fetchValoresData() → listar_valores_entregadores
```

---

## 🎣 Hooks Principais - Detalhamento

### `useDashboardPage.ts`

**Responsabilidade**: Hook central que gerencia TODO o estado do dashboard.

#### Estado Gerenciado

```typescript
interface DashboardPageState {
  // Filtros
  filters: DashboardFilters;
  
  // Tabs
  activeTab: string;
  
  // Dados principais
  mainData: DashboardResumoData | null;
  
  // Evolução
  anoEvolucao: number;
  
  // Dimensões (options para selects)
  anosDisponiveis: number[];
  semanasDisponiveis: string[];
  // ... outras dimensões
}
```

#### Funções Principais

| Função | Descrição | Quando Usar |
|--------|-----------|-------------|
| `setFilters()` | Atualiza filtros com validação | Mudança de filtro pelo usuário |
| `setFiltersSafe()` | Wrapper com proteção de referência | Internamente pelo hook |
| `changeTab()` | Muda tab ativa | Click em tab |
| `buildFilterPayload()` | Converte filtros para RPC | Antes de toda chamada RPC |

#### Dependências Críticas

```typescript
// filtersKey - controla quando re-fetch de dados
const filtersKey = useMemo(() => {
  return JSON.stringify({
    ano: filters.ano,
    semana: filters.semana,
    // ... todos os filtros relevantes
  });
}, [filters.ano, filters.semana, ...]); // ⚠️ CRÍTICO: incluir TODOS os filtros
```

**⚠️ ATENÇÃO**: Se um filtro não estiver em `filtersKey`, mudá-lo NÃO vai re-fetch dados!

---

### `useTabData.ts`

**Responsabilidade**: Gerencia dados para tabs genéricas (UTR, Entregadores, Valores, Prioridade).

#### Lógica de Cache

```typescript
const cacheKey = `${tab}-${JSON.stringify(filterPayload)}`;

// 1. Verifica cache
const cached = getCached({ tab, filterPayload });
if (cached) return cached;

// 2. Se não tem cache, busca do servidor
const data = await fetchTabData({ tab, filterPayload });

// 3. Salva no cache
setCached({ tab, filterPayload }, data);
```

#### Sistema de Deduplicação

Evita múltiplas chamadas simultâneas para mesma query:

```typescript
const pendingRequests = new Map<string, Promise>();

// Se já tem request pendente, reutiliza
if (pendingRequests.has(queueKey)) {
  return await pendingRequests.get(queueKey);
}

// Senão, cria nova e armazena
const promise = fetchData();
pendingRequests.set(queueKey, promise);
```

#### Rate Limiting

```typescript
const MIN_REQUEST_INTERVAL = 500; // ms

// Verifica se último request foi há menos de 500ms
if (lastRequestTime + MIN_REQUEST_INTERVAL > now) {
  return; // Ignora request
}
```

---

### `useCache.ts`

**Responsabilidade**: Sistema de cache em memória com TTL.

#### Configuração

```typescript
interface CacheConfig {
  ttl: number;                    // Time to live (ms)
  getCacheKey: (params) => string; // Função para gerar chave
}

// Uso
const { getCached, setCached } = useCache({
  ttl: 5 * 60 * 1000, // 5 minutos
  getCacheKey: (params) => `${params.tab}-${JSON.stringify(params.filters)}`
});
```

#### Estrutura Interna

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
```

#### Invalidação

```typescript
// Manual
cache.clear();

// Automática (TTL)
if (now > entry.expiresAt) {
  cache.delete(key);
}

// Por mudança de filtro
// (chave muda automaticamente)
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Adicionar Novo Filtro

**Objetivo**: Adicionar filtro por "Tipo de Veículo"

#### 1. Adicionar ao tipo de filtros

```typescript
// src/types/filters.ts
interface DashboardFilters {
  // ... filtros existentes
  tipoVeiculo: string | null; // NOVO
}
```

#### 2. Adicionar ao estado inicial

```typescript
// src/hooks/useDashboardPage.ts
const [filters, setFilters] = useState<DashboardFilters>({
  // ... valores existentes
  tipoVeiculo: null, // NOVO
});
```

#### 3. Adicionar ao filtersKey

```typescript
const filtersKey = useMemo(() => {
  return JSON.stringify({
    // ... chaves existentes
    tipoVeiculo: filters.tipoVeiculo, // NOVO - CRÍTICO!
  });
}, [
  // ... deps existentes
  filters.tipoVeiculo, // NOVO
]);
```

#### 4. Adicionar ao buildFilterPayload

```typescript
// src/utils/helpers.ts
export const buildFilterPayload = (filters, currentUser) => {
  return {
    //... campos existentes
    p_tipo_veiculo: filters.tipoVeiculo || null, // NOVO
  };
};
```

#### 5. Atualizar RPC

```sql
-- Migration
CREATE OR REPLACE FUNCTION dashboard_resumo(
  -- ... parâmetros existentes
  p_tipo_veiculo text DEFAULT NULL -- NOVO
)
RETURNS jsonb AS $$
BEGIN
  -- Adicionar ao WHERE
  AND (p_tipo_veiculo IS NULL OR tipo_veiculo = p_tipo_veiculo)
END;
$$;
```

#### 6. Adicionar UI

```tsx
// src/components/dashboard/FiltroBar.tsx
<Select
  value={filters.tipoVeiculo || 'Todos'}
  onChange={(value) => setFilters({ tipoVeiculo: value })}
>
  <option value="">Todos</option>
  <option value="MOTO">Moto</option>
  <option value="CARRO">Carro</option>
  <option value="BIKE">Bicicleta</option>
</Select>
```

---

### Exemplo 2: Debuggar Filtro Não Aplicando

**Sintoma**: Mudou filtro mas dados não atualizaram

#### Passo 1: Verificar Console

```typescript
// Procurar por:
🔴 [setFiltersProtected] Arrays de filtros mudaram

// Ou:
🔴 [buildFilterPayload] Payload gerado: { ... }
```

#### Passo 2: Verificar Network Tab

1. Abrir DevTools (F12)
2. Network tab
3. Filtrar por "rpc"
4. Ver payload enviado:

```json
{
  "p_ano": 2025,
  "p_semana": 1,
  "p_praca": "GUARULHOS", // ← Verificar se está correto
  "p_sub_praca": null
}
```

#### Passo 3: Testar RPC Diretamente

```sql
-- No Supabase SQL Editor
SELECT dashboard_resumo(
  2025,              -- p_ano
  1,                 -- p_semana
  'GUARULHOS',       -- p_praca
  NULL,              -- p_sub_praca
  NULL, NULL, NULL, NULL, NULL
);
```

Se retorna dados → problema no frontend  
Se não retorna → problema no RPC/banco

#### Passo 4: Verificar filtersKey

```typescript
// Adicionar log temporário
console.log('filtersKey:', filtersKey);

// Mudar filtro e ver se filtersKey muda
// Se não mudar = filtro não está no useMemo!
```

#### Passo 5: Verificar Conversão de Tipo

```typescript
// ❌ ERRADO
p_praca: '[]'  // Array vazio como string

// ✅ CORRETO
p_praca: null  // null quando sem filtro
```

---

### Exemplo 3: Adicionar Nova Guia

**Objetivo**: Criar guia "Regiões" mostrando métricas por região

#### 1. Criar Component

```tsx
// src/components/views/RegioesView.tsx
export default function RegioesView() {
  const { regioesData, loading } = useTabData('regioes', filterPayload);
  
  if (loading) return <Loading />;
  
  return (
    <div>
      {regioesData.map(regiao => (
        <RegioCard key={regiao.nome} regiao={regiao} />
      ))}
    </div>
  );
}
```

#### 2. Adicionar ao DashboardViewsRenderer

```tsx
// src/components/dashboard/DashboardViewsRenderer.tsx
{activeTab === 'regioes' && (
  <RegioesView />
)}
```

#### 3. Criar RPC

```sql
CREATE OR REPLACE FUNCTION listar_regioes(
  p_ano integer DEFAULT NULL,
  p_semana integer DEFAULT NULL,
  p_organization_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(row_to_json(t))
    FROM (
      SELECT 
        regiao,
        COUNT(DISTINCT pessoa_entregadora) as total_entregadores,
        SUM(numero_de_corridas_aceitas) as total_corridas
      FROM dados_corridas
      WHERE ...
      GROUP BY regiao
      ORDER BY total_corridas DESC
    ) t
  );
END;
$$;
```

#### 4. Adicionar ao Fetcher

```typescript
// src/utils/tabData/fetchers.ts
export async function fetchRegioesData(options: FetchOptions) {
  const result = await safeRpc('listar_regioes', options.filterPayload);
  
  if (result.error) {
    return { data: [], error: result.error };
  }
  
  return { data: result.data, error: null };
}
```

#### 5. Adicionar ao Switch

```typescript
// src/hooks/useTabDataFetcher.ts
switch (tab) {
  case 'regioes':
    return await fetchRegioesData({ filterPayload });
  // ... outros casos
}
```

#### 6. Adicionar Tab na UI

```tsx
// src/components/dashboard/FiltroBar.tsx
<button
  onClick={() => changeTab('regioes')}
  className={activeTab === 'regioes' ? 'active' : ''}
>
  Regiões
</button>
```

---

## ❓ FAQ (Perguntas Frequentes)

### Q1: Por que valores estão 100x maiores?

**A**: Valores de taxas estão em CENTAVOS no banco!

```sql
-- ❌ ERRADO
SELECT SUM(soma_das_taxas_das_corridas_aceitas) FROM dados_corridas;
-- Retorna: 197577 (centavos)

-- ✅ CORRETO  
SELECT SUM(soma_das_taxas_das_corridas_aceitas) / 100.0 FROM dados_corridas;
-- Retorna: 1975.77 (reais)
```

---

### Q2: Cache não está invalidando?

**A**: Hard refresh no navegador!

- **Windows**: `Ctrl + Shift + R` ou `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`
- **Alternativa**: Modo anônimo

Ou limpar programaticamente:

```typescript
// Adicionar botão temporário
<button onClick={() => window.location.reload()}>
  Forçar Reload
</button>
```

---

### Q3: RPC retorna erro 500?

**Causas comuns**:

1. **Query timeout** - query muito pesada
2. **Permission denied** - RLS bloqueando
3. **Function not found** - nome errado ou não existe

**Debug**:

```sql
-- 1. Ver logs
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- 2. Testar função diretamente
SELECT nome_da_funcao(parametros);

-- 3. Ver erro completo
-- No Supabase Dashboard → Logs → API
```

---

### Q4: Semana ISO vs Semana padrão?

**Diferença**:
- **ISO Week**: Semana começa na segunda-feira (usado no sistema)
- **US Week**: Semana começa no domingo

**Conversão**:

```sql
-- ✅ USAR ISO
EXTRACT(ISOYEAR FROM data)
EXTRACT(WEEK FROM data)  -- Já retorna ISO no PostgreSQL

-- ❌ NÃO USAR
EXTRACT(YEAR FROM data)  -- Pode diferir no início/fim do ano
```

**Exemplo**:
- 2025-01-05 (domingo):
  - ISO Week: Semana 1 de 2025
  - US Week: Semana 2 de 2025

---

### Q5: Como adicionar índice para melhorar performance?

```sql
-- 1. Identificar query lenta
EXPLAIN ANALYZE
SELECT * FROM dashboard_resumo(2025, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- 2. Ver se está usando Seq Scan (ruim)
Seq Scan on dados_corridas (cost=0.00..1234567.89)

-- 3. Criar índice para colunas do WHERE
CREATE INDEX idx_minha_query
ON dados_corridas (coluna1, coluna2)
INCLUDE (coluna_select);

-- 4. Testar novamente
EXPLAIN ANALYZE  -- Agora deve mostrar Index Scan
```

---

### Q6: Filtro de semana não funciona com múltiplas semanas?

**Atual**: Sistema pega apenas ÚLTIMA semana selecionada (single-select).

**Motivo**: `filtersKey` usa apenas `filters.semana` (number), não `filters.semanas` (array).

**Para habilitar múltiplas**:

```typescript
// 1. Mudar filtersKey
const filtersKey = useMemo(() => {
  return JSON.stringify({
    semanas: filters.semanas.join(','), // MUDAR
  });
}, [filters.semanas]); // MUDAR

// 2. Atualizar buildFilterPayload
p_semana: filters.semanas.join(','), // CSV

// 3. Atualizar RPC
WHERE semana_numero = ANY(string_to_array(p_semana, ',')::int[])
```

---

## 🚀 Guia de Onboarding

### Para Novos Desenvolvedores

#### Dia 1: Setup

1. **Clonar repositório**
```bash
git clone <repo-url>
cd DASHBOARD-GERAL
```

2. **Instalar dependências**
```bash
npm install
```

3. **Configurar .env.local**
```env
NEXT_PUBLIC_SUPABASE_URL=https://ulmobmmlkevxswxpcyza.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

4. **Rodar localmente**
```bash
npm run dev
# Acessar: http://localhost:3000
```

5. **Login de teste**
- Email: teste@exemplo.com
- Senha: (pedir ao admin)

---

#### Dia 2: Explorar Código

1. **Ler esta documentação completa** (`SISTEMA-COMPLETO.md`)

2. **Explorar estrutura** (`src/` directory)

3. **Testar filtros** no dashboard local

4. **Ver Network tab** (F12) para entender chamadas RPC

5. **Ler código dos componentes principais**:
   - `DashboardView.tsx`
   - `useDashboardPage.ts`
   - `buildFilterPayload()`

---

#### Dia 3: Primeira Modificação

**Tarefa**: Mudar cor de um gráfico

1. Encontrar componente da guia Dashboard
2. Localizar gráfico (ex: `BarChart`)
3. Mudar propriedade `fill="#8884d8"` para outra cor
4. Ver resultado no browser

---

#### Dia 4-5: Entender Fluxo de Dados

1. **Seguir um filtro** do início ao fim:
   - Click no select → `setFilters()`
   - → `filtersKey` muda
   - → `useEffect` trigga
   - → `buildFilterPayload()`
   - → `safeRpc()` chama RPC
   - → Dados transformados
   - → Component re-renderiza

2. **Debuggar com console.log**:
```typescript
console.log('🔵 Filtro mudou:', filters);
console.log('🟢 Payload:', filterPayload);  
console.log('🟡 Dados recebidos:', data);
```

---

#### Semana 2: Primeira Feature

**Objetivo**: Adicionar contagem de corridas na guia Dashboard

1. Verificar se dado já vem do RPC
2. Se sim, adicionar ao componente
3. Se não, modificar RPC para incluir
4. Testar localmente
5. Fazer PR para review

---

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Rodar local
npm run build            # Build produção
npm run lint             # Verificar erros

# Git
git checkout -b feature/minha-feature
git commit -m "feat: descrição"
git push origin feature/minha-feature

# Supabase (se tiver CLI)
supabase login
supabase db reset        # Reset local DB
supabase db push         # Push migrations
```

---la para

## 📚 Referências

- **Documentação Supabase**: https://supabase.com/docs
- **PostgreSQL Index Tuning**: https://www.postgresql.org/docs/current/indexes.html
- **Next.js App Router**: https://nextjs.org/docs/app
- **TypeScript Best Practices**: https://www.typescriptlang.org/docs/
- **React Hooks**: https://react.dev/reference/react
- **Recharts (Gráficos)**: https://recharts.org

---

**Fim da Documentação Técnica Completa** 📊  
**Versão**: 1.0 | **Atualizado**: 26/11/2025
