# 🚀 COMO INSTALAR O SISTEMA DE MONITORAMENTO

## ⚠️ IMPORTANTE
O erro `404` significa que as funções ainda não existem no banco de dados!

---

## 📋 PASSO A PASSO

### 1️⃣ Abrir o Supabase SQL Editor
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **"SQL Editor"**

### 2️⃣ Copiar o SQL
1. Abra o arquivo: **`MONITORAMENTO_LIMPO_FINAL.sql`**
2. Selecione TUDO (Ctrl+A)
3. Copie (Ctrl+C)

### 3️⃣ Executar no Supabase
1. No SQL Editor do Supabase, cole o código (Ctrl+V)
2. Clique no botão **"Run"** (▶️) ou pressione **Ctrl+Enter**
3. Aguarde a execução (pode levar alguns segundos)

### 4️⃣ Verificar o Resultado
Você deve ver mensagens como:
```
✅ INSTALAÇÃO CONCLUÍDA
✓ Tabela user_activities: OK
✓ registrar_atividade: OK (1 versão)
✓ listar_usuarios_online: OK (1 versão)
✓ historico_atividades_usuario: OK (1 versão)
🎯 TUDO PRONTO!
```

---

## ✅ TESTE O MONITORAMENTO

### Passo 1: Testar como Admin
1. Acesse o dashboard com sua conta admin
2. Clique na aba **"Monitoramento"**
3. Você deve ver uma mensagem de "Nenhum usuário online" (é normal)

### Passo 2: Simular outro usuário
1. Abra um **navegador anônimo/privado** (Ctrl+Shift+N no Chrome)
2. Acesse o dashboard
3. Faça login com outra conta (não admin)
4. Navegue pelas abas

### Passo 3: Verificar no Admin
1. Volte para a aba do admin
2. Na aba "Monitoramento", você deve ver:
   - Email do usuário
   - Status: 🟢 Ativo
   - Aba atual
   - Filtros aplicados
   - Tempo online

---

## 🐛 TROUBLESHOOTING

### Erro: "function name is not unique"
**Solução**: O SQL `MONITORAMENTO_LIMPO_FINAL.sql` já resolve isso automaticamente. Execute-o novamente.

### Erro: 404 no console
**Causa**: Você ainda não executou o SQL no Supabase.
**Solução**: Siga os passos 1-3 acima.

### Erro: "Acesso negado"
**Causa**: Você não está logado como admin.
**Solução**: Verifique se sua conta tem `is_admin = true` na tabela `user_profiles`.

### Monitoramento não mostra usuários
**Possíveis causas**:
1. O outro usuário não está online (precisa estar com o dashboard aberto)
2. Passaram mais de 5 minutos desde a última atividade
3. O navegador está bloqueando as requisições

---

## 📊 COMO FUNCIONA

O sistema registra automaticamente:
- ✅ **Login**: Quando o usuário acessa o dashboard
- ✅ **Tab Change**: Quando muda de aba
- ✅ **Filter Change**: Quando aplica filtros
- ✅ **Heartbeat**: A cada 1 minuto (mantém "online")

### Indicadores de Status:
- 🟢 **Verde**: Ativo (última atividade < 2 minutos)
- 🟡 **Amarelo**: Inativo (2-5 minutos)
- ⚫ **Offline**: Não aparece na lista (> 5 minutos)

---

## 💡 DICAS

1. **Atualização Automática**: O monitoramento atualiza sozinho a cada 10 segundos
2. **Botão Atualizar**: Clique no botão "🔄 Atualizar" para atualizar manualmente
3. **Múltiplas Sessões**: Um usuário pode ter várias sessões (diferentes abas/navegadores)
4. **Histórico**: Use a função `historico_atividades_usuario(user_id)` para ver o histórico

---

## ✨ ESTÁ FUNCIONANDO?

Se você seguiu todos os passos e ainda tem erro 404:
1. Verifique se está no projeto correto no Supabase
2. Confirme que o SQL foi executado sem erros
3. Tente fazer logout e login novamente
4. Limpe o cache do navegador (Ctrl+Shift+Delete)

---

**🎉 Pronto! Seu sistema de monitoramento está instalado e funcionando!**

