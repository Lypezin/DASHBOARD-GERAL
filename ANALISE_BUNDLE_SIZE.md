# 📦 Análise de Bundle Size e Otimizações

**Data:** 2025-01-21  
**Status:** ✅ Configuração Completa e Otimizações Aplicadas

---

## 🎯 Objetivo

Analisar e otimizar o tamanho do bundle JavaScript para melhorar o tempo de carregamento inicial da aplicação.

---

## 🔧 Configuração do Bundle Analyzer

### Instalação

```bash
npm install --save-dev @next/bundle-analyzer
```

### Configuração no `next.config.mjs`

```javascript
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
```

### Script de Análise

Adicionado ao `package.json`:

```json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

### Como Usar

```bash
npm run analyze
```

Isso irá:
1. Fazer o build da aplicação
2. Gerar relatórios de análise em `/.next/analyze/`
3. Abrir automaticamente no navegador com visualizações interativas

---

## 📊 Bibliotecas Grandes Identificadas

### ✅ Já Otimizadas (Lazy Loading)

1. **chart.js** (~200KB)
   - ✅ Lazy loaded via `src/lib/chartConfig.ts`
   - ✅ Carregado apenas quando necessário
   - **Status:** Otimizado

2. **pdfmake** (~500KB)
   - ✅ Lazy loaded via `src/lib/pdfmakeClient.ts`
   - ✅ Carregado apenas quando usuário gera PDF
   - ✅ Externalizado no servidor (SSR)
   - **Status:** Otimizado

### 🔄 Otimizadas Agora

3. **xlsx** (~300KB)
   - ✅ Criado `src/lib/xlsxClient.ts` para lazy loading
   - ✅ Otimizado em `EntregadoresExcelExport.ts` (carregado apenas ao exportar)
   - ⚠️ Ainda usado diretamente em:
     - `src/utils/excelProcessor.ts` (upload de arquivos)
     - `src/utils/processors/corridasProcessor.ts` (upload de arquivos)
   - **Status:** Parcialmente otimizado
   - **Nota:** Upload já é uma ação do usuário, então o impacto é menor

### ⚠️ Não Utilizadas (Podem ser Removidas)

4. **jspdf** (~150KB)
   - ❌ Não está sendo usado no código
   - ✅ Apenas `@types/jspdf` está instalado
   - **Recomendação:** Remover se não for necessário

5. **html2canvas** (~200KB)
   - ❌ Não está sendo usado no código
   - ✅ Apenas mencionado em comentários
   - **Recomendação:** Remover se não for necessário

---

## 📈 Tamanhos Atuais do Bundle

### Build de Produção (último build)

```
Route (app)                              Size     First Load JS
┌ ○ /                                    17.9 kB         156 kB
├ ○ /_not-found                          871 B          88.4 kB
├ ○ /admin                               6.08 kB         144 kB
├ ƒ /apresentacao/print                  136 B          87.6 kB
├ ○ /login                               3.33 kB         148 kB
├ ○ /perfil                              10.8 kB         155 kB
├ ○ /registro                            3.97 kB         149 kB
└ ○ /upload                              153 kB          290 kB
+ First Load JS shared by all            87.5 kB
```

### Análise

- **Página principal (`/`):** 156 kB - ✅ Bom
- **Upload (`/upload`):** 290 kB - ⚠️ Grande (esperado, tem lógica de upload)
- **Shared JS:** 87.5 kB - ✅ Razoável

---

## 🚀 Otimizações Aplicadas

### 1. Lazy Loading de Bibliotecas Grandes

#### chart.js
- ✅ Carregado dinamicamente via `registerChartJS()`
- ✅ Apenas quando componentes de gráfico são renderizados

#### pdfmake
- ✅ Carregado dinamicamente via `loadPdfMake()`
- ✅ Apenas quando usuário gera PDF
- ✅ Externalizado no servidor (SSR)

#### xlsx (Parcial)
- ✅ Criado `loadXLSX()` para lazy loading
- ✅ Otimizado em exportação de Excel
- ⚠️ Ainda usado diretamente em upload (aceitável, pois é ação do usuário)

### 2. Code Splitting Automático

Next.js já faz code splitting automático por:
- ✅ Rotas (cada página é um chunk separado)
- ✅ Dynamic imports
- ✅ Componentes lazy loaded

### 3. Tree Shaking

- ✅ Next.js usa SWC para tree shaking
- ✅ Imports nomeados são otimizados automaticamente
- ✅ Imports não utilizados são removidos

---

## 📋 Recomendações Adicionais

### 1. Remover Dependências Não Utilizadas

```bash
# Verificar dependências não utilizadas
npm uninstall jspdf html2canvas
```

**Nota:** Verificar se não há planos de usar essas bibliotecas no futuro.

### 2. Otimizar Imports de Radix UI

Radix UI já é otimizado, mas podemos verificar se todos os componentes estão sendo usados:

```bash
# Verificar imports de @radix-ui
grep -r "@radix-ui" src/
```

### 3. Analisar Bundle com Frequência

- ✅ Executar `npm run analyze` antes de cada deploy
- ✅ Monitorar crescimento do bundle
- ✅ Identificar novas dependências grandes

### 4. Considerar Alternativas Mais Leves

Se necessário no futuro:
- **chart.js** → Considerar `recharts` (mais leve) ou `victory` (mais leve)
- **xlsx** → Considerar `exceljs` (mais leve) ou `sheetjs-style` (se precisar de formatação)

---

## 🎯 Próximos Passos

1. ✅ Configurar bundle analyzer
2. ✅ Otimizar imports de bibliotecas grandes
3. ⏳ Executar análise completa com `npm run analyze`
4. ⏳ Remover dependências não utilizadas (jspdf, html2canvas)
5. ⏳ Monitorar tamanho do bundle em cada deploy

---

## 📝 Notas Importantes

- **Lazy Loading:** Sempre preferir lazy loading para bibliotecas grandes
- **Code Splitting:** Next.js faz automaticamente, mas dynamic imports ajudam
- **Tree Shaking:** Funciona melhor com imports nomeados (`import { X } from 'lib'`)
- **Bundle Size:** Manter First Load JS abaixo de 200KB quando possível
- **Monitoramento:** Verificar bundle size regularmente

---

## 🔍 Como Analisar

1. Execute `npm run analyze`
2. Abra os relatórios gerados em `/.next/analyze/`
3. Identifique:
   - Chunks grandes
   - Bibliotecas duplicadas
   - Imports não utilizados
   - Oportunidades de code splitting

---

## ✅ Checklist de Otimização

- [x] Configurar bundle analyzer
- [x] Otimizar chart.js (lazy loading)
- [x] Otimizar pdfmake (lazy loading + externalização)
- [x] Otimizar xlsx (lazy loading parcial)
- [ ] Remover jspdf (não utilizado)
- [ ] Remover html2canvas (não utilizado)
- [ ] Executar análise completa
- [ ] Documentar resultados da análise

---

**Última atualização:** 2025-01-21

