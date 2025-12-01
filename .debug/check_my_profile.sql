-- Verificar o perfil do usuário atual
-- Execute no SQL Editor

SELECT 
    id,
    role,
    is_admin,
    organization_id,
    created_at
FROM user_profiles
WHERE id = auth.uid();
