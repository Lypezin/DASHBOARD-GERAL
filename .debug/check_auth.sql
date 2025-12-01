-- Teste para verificar auth.uid() no SQL Editor
SELECT 
    auth.uid() as current_user_id,
    (SELECT role FROM user_profiles WHERE id = auth.uid()) as user_role,
    (SELECT is_admin FROM user_profiles WHERE id = auth.uid()) as is_admin;
