# Funções RPC para Marketing Dashboard

Este arquivo contém instruções para configurar as funções RPC que otimizam o carregamento de dados do dashboard de marketing.

## Instalação

1. Acesse o SQL Editor no Supabase Dashboard
2. Copie e cole o conteúdo do arquivo `marketing_rpc_functions.sql`
3. Execute o script completo

## Funções Criadas

### 1. `get_marketing_totals`
Retorna os totais gerais de marketing (Criado, Enviado, Liberado, Rodando Início) em uma única query.

**Parâmetros:**
- `data_envio_inicial` (text, opcional)
- `data_envio_final` (text, opcional)
- `data_liberacao_inicial` (text, opcional)
- `data_liberacao_final` (text, opcional)
- `rodou_dia_inicial` (text, opcional)
- `rodou_dia_final` (text, opcional)

**Retorno:**
```typescript
{
  criado: number;
  enviado: number;
  liberado: number;
  rodando_inicio: number;
}
```

### 2. `get_marketing_cities_data`
Retorna dados agregados por cidade em uma única query.

**Parâmetros:** (mesmos de `get_marketing_totals`)

**Retorno:**
```typescript
Array<{
  cidade: string;
  enviado: number;
  liberado: number;
  rodando_inicio: number;
}>
```

### 3. `get_marketing_atendentes_data`
Retorna dados agregados por atendente e cidade em uma única query.

**Parâmetros:**
- `data_envio_inicial` (text, opcional)
- `data_envio_final` (text, opcional)
- `data_liberacao_inicial` (text, opcional)
- `data_liberacao_final` (text, opcional)

**Retorno:**
```typescript
Array<{
  responsavel: string;
  enviado: number;
  liberado: number;
  cidade: string;
  cidade_enviado: number;
  cidade_liberado: number;
}>
```

## Índices Criados

O script também cria índices para otimizar as queries:

- `idx_dados_marketing_data_envio` - Índice em `data_envio`
- `idx_dados_marketing_data_liberacao` - Índice em `data_liberacao`
- `idx_dados_marketing_rodou_dia` - Índice em `rodou_dia`
- `idx_dados_marketing_responsavel` - Índice em `responsavel`
- `idx_dados_marketing_regiao_atuacao` - Índice em `regiao_atuacao`
- `idx_dados_marketing_sub_praca_abc` - Índice em `sub_praca_abc`
- `idx_dados_marketing_responsavel_data_envio` - Índice composto
- `idx_dados_marketing_responsavel_data_liberacao` - Índice composto
- `idx_dados_marketing_regiao_sub_praca` - Índice composto

## Fallback

O código TypeScript está preparado para usar as funções RPC quando disponíveis, mas faz fallback automático para queries diretas caso as funções RPC não estejam configuradas. Isso garante que o sistema continue funcionando mesmo sem as otimizações.

## Benefícios

- **Performance**: Reduz drasticamente o número de queries ao banco (de dezenas para apenas 1-2 por carregamento)
- **Escalabilidade**: Melhor suporta grandes volumes de dados
- **Manutenibilidade**: Lógica de agregação centralizada no banco de dados

