<!-- e62a6255-62e9-4331-8aca-204b89f3dbfc bd3254e6-24ad-4648-a4f8-d935bfd91af4 -->
# Plano de Refatoração - Arquivos com Mais de 500 Linhas

## Arquivos Identificados para Refatoração

### CRÍTICO (acima de 1000 linhas ou muito próximo)

1. **`src/components/ApresentacaoView.tsx`** - 972 linhas

- **Prioridade**: IMEDIATA (próximo de 1000 linhas)
- **Estratégia**: 
- Extrair lógica de processamento de dados para `ApresentacaoDataProcessor.ts`
- Extrair lógica de geração de PDF para `ApresentacaoPdfGenerator.ts`
- Extrair componentes de UI do preview para `ApresentacaoPreview.tsx`
- Extrair hooks customizados: `useApresentacaoData.ts`, `useApresentacaoSlides.ts`
- Manter apenas orquestração no componente principal

2. **`src/hooks/useTabDataFetcher.ts`** - 841 linhas

- **Prioridade**: IMEDIATA
- **Estratégia**:
- Dividir em múltiplos hooks especializados por tipo de dado
- Extrair lógica de fetch para utilitários: `tabDataFetchers.ts`
- Criar hooks específicos: `useUtrDataFetcher.ts`, `useEntregadoresDataFetcher.ts`, `useValoresDataFetcher.ts`, etc.
- Manter hook principal apenas como orquestrador

3. **`src/app/perfil/page.tsx`** - 810 linhas

- **Prioridade**: IMEDIATA
- **Estratégia**:
- Extrair formulário de perfil para `PerfilForm.tsx`
- Extrair seção de alteração de senha para `PerfilPasswordSection.tsx`
- Extrair lógica de validação para `perfilValidation.ts`
- Extrair lógica de atualização para hook `usePerfilUpdate.ts`
- Manter página apenas como container

### PRÓXIMOS DE 500 LINHAS (monitorar e refatorar preventivamente)

4. **`src/components/views/ValoresCidadeView.tsx`** - 471 linhas
5. **`src/components/views/DashboardView.tsx`** - 469 linhas
6. **`src/components/views/evolucao/EvolucaoDataProcessor.ts`** - 469 linhas
7. **`src/app/page.tsx`** - 451 linhas
8. **`src/components/views/ValoresView.tsx`** - 440 linhas

## Estrutura de Refatoração

### Diretórios a Criar/Usar

- `src/components/apresentacao/` (já existe, adicionar subcomponentes)
- `src/hooks/apresentacao/` (novo)
- `src/utils/apresentacao/` (novo)
- `src/hooks/tabData/` (novo)
- `src/utils/tabData/` (novo)
- `src/components/perfil/` (novo)

## Princípios de Refatoração

1. **Separação de Responsabilidades**: Cada arquivo deve ter uma única responsabilidade
2. **Reutilização**: Componentes extraídos devem ser reutilizáveis
3. **Manutenibilidade**: Código mais fácil de entender e modificar
4. **Performance**: Manter otimizações existentes (React.memo, useMemo, useCallback)
5. **TypeScript**: Manter tipagem forte em todos os componentes
6. **Consistência**: Usar tipos exportados de hooks/utilitários

## Ordem de Execução

1. **Fase 1 - Críticos**: Refatorar os 3 arquivos acima de 800 linhas
2. **Fase 2 - Preventivos**: Refatorar arquivos próximos de 500 linhas
3. **Fase 3 - Validação**: Rodar `npm run build` após cada refatoração
4. **Fase 4 - Testes**: Verificar funcionalidade após cada refatoração

## Checklist de Validação

- [ ] Arquivo tem menos de 500 linhas após refatoração
- [ ] `npm run build` passa sem erros
- [ ] Não há erros de TypeScript
- [ ] Imports estão corretos
- [ ] Tipos estão centralizados e consistentes
- [ ] Componentes seguem a estrutura de diretórios definida
- [ ] Funcionalidade mantida (sem regressões)

### To-dos

- [ ] Refatorar ApresentacaoView.tsx (972 linhas) - extrair processamento de dados, geração de PDF e componentes de UI
- [ ] Refatorar useTabDataFetcher.ts (841 linhas) - dividir em hooks especializados e utilitários
- [ ] Refatorar app/perfil/page.tsx (810 linhas) - extrair formulários e lógica para componentes e hooks
- [ ] Refatorar ValoresCidadeView.tsx (471 linhas) - extrair lógica de fetch e componentes de filtro
- [ ] Refatorar DashboardView.tsx (469 linhas) - extrair seções de cards e gráficos para componentes separados
- [ ] Refatorar EvolucaoDataProcessor.ts (469 linhas) - dividir em múltiplos processadores especializados
- [ ] Refatorar app/page.tsx (451 linhas) - extrair lógica de filtros e renderização condicional
- [ ] Refatorar ValoresView.tsx (440 linhas) - extrair tabela e lógica de pesquisa para componentes separados
- [ ] Validar build após todas as refatorações - rodar npm run build e corrigir erros