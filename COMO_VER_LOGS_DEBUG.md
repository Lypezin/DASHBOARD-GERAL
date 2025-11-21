# Como Ver Logs de Debug em Modo Desenvolvimento

## 📋 Pré-requisitos

1. Certifique-se de que está rodando a aplicação em **modo desenvolvimento**
2. O projeto deve estar rodando com `npm run dev` (não `npm run build`)

## 🔍 Onde Ver os Logs

### 1. Console do Navegador (Recomendado)

1. Abra a aplicação no navegador
2. Pressione `F12` ou `Ctrl+Shift+I` (Windows/Linux) ou `Cmd+Option+I` (Mac)
3. Vá para a aba **Console**
4. Os logs aparecerão automaticamente quando você:
   - Navegar para a aba "Evolução"
   - Mudar o ano selecionado
   - Alternar entre visualização mensal e semanal

### 2. Terminal do Desenvolvimento

Se você estiver rodando `npm run dev`, alguns logs também podem aparecer no terminal.

## 📊 Tipos de Logs Disponíveis

### Logs de Processamento de Dados

Procure por mensagens que começam com:
- `[processEvolucaoData]` - Processamento dos dados de evolução
- `[getMetricConfig]` - Configuração de métricas individuais
- `[createChartData]` - Criação dos dados do gráfico

### Logs de Busca de Dados

Procure por mensagens que começam com:
- `[useDashboardEvolucao]` - Dados recebidos do Supabase

## 🔎 Exemplo de Logs que Você Verá

```
[useDashboardEvolucao] ========== DADOS RECEBIDOS DO SUPABASE ==========
[useDashboardEvolucao] Ano selecionado: 2024
[useDashboardEvolucao] Praça filtro: TODAS
[useDashboardEvolucao] Dados mensais recebidos: 3 registros
[useDashboardEvolucao] Primeiros 3 meses: [{ano: 2024, mes: 1, mes_nome: "Janeiro", ...}, ...]

[processEvolucaoData] Mensal - Ano selecionado: 2024
[processEvolucaoData] Mensal - Total de dados recebidos: 3
[processEvolucaoData] Mensal - Dados por mês: [{mes: 1, mes_nome: "Janeiro", completadas: 176455}, ...]
[processEvolucaoData] Mensal - Total de labels: 12
[processEvolucaoData] Mensal - Labels: Janeiro, Fevereiro, Março, ...
[processEvolucaoData] Janeiro (índice 0, mês 1): completadas=176455
[processEvolucaoData] Fevereiro (índice 1, mês 2): SEM DADOS
...

[createChartData] ========== INÍCIO VALIDAÇÃO ==========
[createChartData] Labels: 12, Datasets: 4
[createChartData] Dataset 0 (🚗 Corridas Completadas): 12 elementos
[createChartData] Dataset 0 - Primeiros 5: Janeiro=176455, Fevereiro=null, Março=null, ...
```

## 🛠️ Filtrar Logs no Console

Para facilitar a visualização, você pode:

1. **Filtrar por texto**: Digite `[processEvolucaoData]` ou `[useDashboardEvolucao]` na barra de filtro do console
2. **Filtrar por nível**: Use os botões de filtro (Info, Warning, Error) no console
3. **Limpar console**: Clique no ícone de limpar (🚫) para remover logs antigos

## ⚠️ Importante

- Os logs **só aparecem em modo desenvolvimento** (`NODE_ENV=development`)
- Em produção, os logs são silenciados para não expor informações sensíveis
- Se você não ver os logs, verifique se:
  - Está rodando `npm run dev` (não `npm run build`)
  - O console do navegador está aberto
  - Você está na aba "Evolução" do dashboard

## 🐛 Solução de Problemas

### Não vejo nenhum log

1. Verifique se está em modo desenvolvimento:
   ```bash
   npm run dev
   ```

2. Verifique se o console do navegador está aberto (F12)

3. Navegue para a aba "Evolução" do dashboard

4. Recarregue a página (Ctrl+R ou F5)

### Vejo logs mas não entendo

Os logs mostram:
- **Dados recebidos do Supabase**: O que veio do banco de dados
- **Dados processados**: Como os dados foram mapeados para os labels
- **Dados do gráfico**: O que foi enviado para o Chart.js

Se algo estiver errado, compare:
- Quantos registros vieram do Supabase
- Quantos foram mapeados corretamente
- Se os índices dos labels correspondem aos dados

