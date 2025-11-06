# 🏆 GUIA DE INSTALAÇÃO - Sistema de Conquistas

## 📋 Pré-requisitos

- Acesso ao painel do Supabase
- Permissões de administrador no projeto
- Dashboard já configurado e funcionando

---

## 🚀 Instalação Passo a Passo

### Passo 1: Acessar o SQL Editor

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **"SQL Editor"**
4. Clique em **"New query"**

### Passo 2: Executar o Script SQL

1. Abra o arquivo `CRIAR_SISTEMA_CONQUISTAS.sql` na raiz do projeto
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou pressione `Ctrl+Enter`)

Aguarde a execução. Você verá mensagens de sucesso para:
- Criação das tabelas `conquistas` e `user_conquistas`
- Criação dos índices
- Configuração das políticas RLS
- Inserção das 12 conquistas iniciais
- Criação das funções:
  - `listar_conquistas_usuario()`
  - `marcar_conquista_visualizada()`
  - `verificar_conquistas()`

### Passo 3: Verificar a Instalação

Execute as seguintes queries de teste:

```sql
-- 1. Verificar se as conquistas foram inseridas
SELECT COUNT(*) as total_conquistas FROM public.conquistas;
-- Resultado esperado: 12

-- 2. Listar todas as conquistas
SELECT codigo, nome, categoria, pontos, raridade 
FROM public.conquistas 
ORDER BY ordem;

-- 3. Testar função de listagem
SELECT * FROM listar_conquistas_usuario();
```

---

## 🎯 Conquistas Disponíveis

### 📅 Frequência (4 conquistas)

| Código | Nome | Descrição | Pontos | Raridade |
|--------|------|-----------|--------|----------|
| `primeiro_acesso` | Primeiro Passo 🎯 | Acessou o dashboard pela primeira vez | 10 | Comum |
| `explorador` | Explorador 🗺️ | Visitou todas as abas do dashboard | 20 | Comum |
| `usuario_ativo` | Usuário Ativo 🔥 | Acessou o dashboard por 7 dias consecutivos | 50 | Rara |
| `maratonista` | Maratonista 🏃 | Acessou o dashboard por 30 dias consecutivos | 150 | Épica |

### 📊 Análise (4 conquistas)

| Código | Nome | Descrição | Pontos | Raridade |
|--------|------|-----------|--------|----------|
| `analista_iniciante` | Analista Iniciante 📊 | Filtrou dados 10 vezes | 15 | Comum |
| `analista_expert` | Analista Expert 📈 | Filtrou dados 100 vezes | 75 | Rara |
| `detetive_dados` | Detetive de Dados 🔍 | Usou a busca de entregadores 50 vezes | 50 | Rara |
| `comparador` | Comparador ⚖️ | Usou a aba de comparação 5 vezes | 30 | Comum |

### 📈 Dados/Performance (2 conquistas)

| Código | Nome | Descrição | Pontos | Raridade |
|--------|------|-----------|--------|----------|
| `eficiencia_total` | Eficiência Total ⚡ | Alcançou 95% de aderência | 100 | Épica |
| `mestre_utr` | Mestre do UTR 🎖️ | Manteve UTR acima de 2.5 | 80 | Rara |

### ⭐ Especiais (2 conquistas)

| Código | Nome | Descrição | Pontos | Raridade |
|--------|------|-----------|--------|----------|
| `perfeccionista` | Perfeccionista 💎 | Alcançou 100% de completude de corridas | 200 | Lendária |
| `velocista` | Velocista ⚡ | Carregou o dashboard em menos de 2 segundos | 25 | Comum |

---

## 🎨 Como Funciona no Dashboard

### Verificação Automática

O sistema verifica conquistas automaticamente:
- **A cada 30 segundos** (verificação em background)
- **Ao trocar de aba** (após 1 segundo)
- **Ao aplicar filtros** (após 0.5 segundos)

### Notificações

Quando uma conquista é desbloqueada:
1. Aparece uma notificação animada no canto inferior direito
2. Confetti animado celebra a conquista
3. Badge no botão de conquistas mostra quantas novas há
4. Auto-fecha após 5 segundos (ou clique para fechar)

### Modal de Conquistas

Clique no botão 🏆 no header para ver:
- **Barra de progresso geral** (X/Y conquistadas)
- **Total de pontos** acumulados
- **Filtros** por status (todas/conquistadas/pendentes)
- **Filtros** por categoria (dados/análise/frequência/social)
- **Cards detalhados** com progresso individual

---

## 🔧 Personalização

### Adicionar Nova Conquista

```sql
INSERT INTO public.conquistas (
  codigo, 
  nome, 
  descricao, 
  icone, 
  categoria, 
  criterio_tipo, 
  criterio_valor, 
  pontos, 
  raridade, 
  ordem
) VALUES (
  'minha_conquista',           -- Código único
  'Minha Conquista',           -- Nome exibido
  'Descrição da conquista',    -- Descrição
  '🎉',                        -- Emoji/ícone
  'analise',                   -- Categoria
  'contador',                  -- Tipo: contador|sequencia|meta
  100,                         -- Valor necessário
  50,                          -- Pontos
  'rara',                      -- Raridade
  13                           -- Ordem de exibição
);
```

### Modificar Lógica de Verificação

Edite a função `verificar_conquistas()` no SQL Editor:

```sql
CREATE OR REPLACE FUNCTION public.verificar_conquistas()
RETURNS TABLE (...)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Adicione suas verificações personalizadas aqui
  -- Exemplo:
  IF v_alguma_condicao >= 100 THEN
    INSERT INTO public.user_conquistas (user_id, conquista_id, progresso)
    SELECT v_user_id, id, 100
    FROM public.conquistas
    WHERE codigo = 'minha_conquista'
    ON CONFLICT (user_id, conquista_id) DO NOTHING;
  END IF;
  
  -- ...
END;
$$;
```

### Desativar Conquista

```sql
UPDATE public.conquistas 
SET ativa = false 
WHERE codigo = 'conquista_para_desativar';
```

---

## 🐛 Troubleshooting

### Conquistas não aparecem

1. Verifique se o SQL foi executado com sucesso
2. Confirme que as políticas RLS estão ativas:
   ```sql
   SELECT tablename, policyname, permissive, roles, qual 
   FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('conquistas', 'user_conquistas');
   ```

### Notificações não aparecem

1. Verifique o console do navegador (F12) para erros
2. Confirme que a função `verificar_conquistas()` existe:
   ```sql
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'verificar_conquistas';
   ```

### Erro de permissão

1. Verifique se as políticas RLS permitem `authenticated` e `anon`:
   ```sql
   GRANT EXECUTE ON FUNCTION listar_conquistas_usuario() TO authenticated, anon;
   GRANT EXECUTE ON FUNCTION marcar_conquista_visualizada(UUID) TO authenticated, anon;
   GRANT EXECUTE ON FUNCTION verificar_conquistas() TO authenticated, anon;
   ```

---

## 📊 Monitoramento

### Ver conquistas mais desbloqueadas

```sql
SELECT 
  c.nome,
  c.icone,
  COUNT(uc.id) as total_usuarios,
  ROUND(COUNT(uc.id)::numeric / (SELECT COUNT(*) FROM auth.users) * 100, 2) as percentual
FROM public.conquistas c
LEFT JOIN public.user_conquistas uc ON uc.conquista_id = c.id
GROUP BY c.id, c.nome, c.icone
ORDER BY total_usuarios DESC;
```

### Ver ranking de pontos

```sql
SELECT 
  u.email,
  SUM(c.pontos) as total_pontos,
  COUNT(uc.id) as total_conquistas
FROM auth.users u
JOIN public.user_conquistas uc ON uc.user_id = u.id
JOIN public.conquistas c ON c.id = uc.conquista_id
GROUP BY u.id, u.email
ORDER BY total_pontos DESC
LIMIT 10;
```

### Ver progresso geral

```sql
SELECT 
  COUNT(DISTINCT user_id) as usuarios_com_conquistas,
  COUNT(*) as total_conquistas_desbloqueadas,
  SUM(CASE WHEN NOT visualizada THEN 1 ELSE 0 END) as nao_visualizadas
FROM public.user_conquistas;
```

---

## 🎉 Pronto!

O sistema de conquistas está instalado e funcionando! 🚀

### Próximos Passos

1. ✅ Execute o SQL no Supabase
2. ✅ Teste acessando o dashboard
3. ✅ Clique no botão 🏆 para ver as conquistas
4. ✅ Explore o dashboard para desbloquear conquistas
5. 🎨 Personalize as conquistas conforme necessário

### Suporte

Se encontrar problemas:
- Verifique o `AUDITORIA_SISTEMA.md` para análise completa
- Consulte o código em `src/hooks/useConquistas.ts`
- Revise os componentes em `src/components/Conquista*.tsx`

**Divirta-se gamificando seu dashboard! 🎮🏆**

