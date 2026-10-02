# Produto

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Uso misto confirmado pelo usuário: equipes de operação, marketing e administração. A visão geral de operação deve receber o maior destaque na entrada do painel. A prioridade de navegação entre marketing e administração ainda não foi definida.

## Product Purpose

O Dashboard Geral da GO Itaim reúne leitura de indicadores de entregas e operação, análise de marketing, gestão de acessos e organizações, envio de dados e criação de apresentações. A abrangência das áreas vem das rotas e componentes existentes; o usuário confirmou que operação, marketing e administração fazem parte do público.

## Positioning

Não há uma proposta competitiva ou mecanismo diferenciador confirmado. Não inventar alegações de desempenho, clientes ou resultados.

## Operating Context

Aplicação web em português do Brasil. A área interna usa uma navegação comum para visão geral, análise, UTR, comparação, entregadores, valores, prioridade/promoção, evolução, dedicado e áreas de marketing. Os indicadores podem ser filtrados por período, praça e dimensões operacionais. Existem ainda telas de autenticação, perfil, administração, upload e apresentações.

## Capabilities and Constraints

- Preservar o nome, o logotipo, as funções existentes e os termos atuais da interface, conforme confirmado pelo usuário.
- Dar prioridade visual à visão geral de operação, com corridas, aderência e praças.
- Manter as áreas de marketing e administração acessíveis para os respectivos usos.
- Projeto existente em Next.js 14 e React 18, integrado ao Supabase.
- Fluxos de acesso existentes: login, registro, recuperação e redefinição de senha.
- O pedido atual é produzir conceitos visuais para aprovação antes de alterar a interface implementada.

## Brand Commitments

- Preservar GO Itaim e o arquivo de marca `public/logo.png`.
- Preservar o nome Dashboard Geral e os termos de produto já usados nas telas.

## Evidence on Hand

- Rotas, componentes e navegação existentes em `src/app` e `src/components`.
- Logotipo GO Itaim em `public/logo.png`.
- Telas de demonstração visual em `src/app/visual-smoke`, com dados sintéticos.
- Não usar depoimentos, métricas promocionais ou alegações não presentes no produto.

## Product Principles

1. Tornar corridas, aderência e praças fáceis de encontrar ao abrir o painel.
2. Apoiar trabalho misto de operação, marketing e administração sem esconder nenhuma dessas áreas.
3. Preservar comportamentos, dados e linguagem já reconhecidos pelos usuários.
4. Apresentar comparações e métricas densas com leitura clara.

## Accessibility & Inclusion

Não há requisito adicional específico confirmado. Preservar o idioma pt-BR e a operação por teclado e em telas menores durante qualquer redesign.
