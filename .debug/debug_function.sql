-- Script para debugar a função dashboard_resumo
-- Execute no SQL Editor

-- Verificar se a função está retornando dados quando chamada COM autenticação
-- (isso simula o que o frontend faz)

-- Primeiro, vamos ver o que auth.uid() retorna
SELECT auth.uid() as meu_user_id;

-- Agora vamos chamar a função SEM especificar organization_id
-- (deixando NULL para que a função decida)
SELECT 
    'Teste 1: NULL org_id' as teste,
    total_ofertadas,
    total_aceitas,
    jsonb_array_length(aderencia_dia) as dias_count,
    aderencia_dia->>0 as primeiro_dia
FROM dashboard_resumo(
  p_ano := 2025,
  p_semana := 38,
  p_praca := 'GUARULHOS'
  -- p_organization_id não especificado = NULL por padrão
);

-- Teste 2: Forçar organization_id como string vazia
SELECT 
    'Teste 2: Empty string' as teste,
    total_ofertadas,
    jsonb_array_length(aderencia_dia) as dias_count
FROM dashboard_resumo(
  p_ano := 2025,
  p_semana := 38,
  p_praca := 'GUARULHOS',
  p_organization_id := ''
);

-- Teste 3: Passar o UUID correto explicitamente
SELECT 
    'Teste 3: UUID explícito' as teste,
    total_ofertadas,
    jsonb_array_length(aderencia_dia) as dias_count
FROM dashboard_resumo(
  p_ano := 2025,
  p_semana := 38,
  p_praca := 'GUARULHOS',
  p_organization_id := '00000000-0000-0000-0000-000000000001'
);
