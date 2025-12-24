import { useState, useEffect } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';

const SENHA_VALORES_CIDADE = 'F4S@1S';
const STORAGE_KEY_AUTH = 'valores_cidade_authenticated';

export const useValoresCidadeAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(STORAGE_KEY_AUTH) === 'true';
    }
    return false;
  });
  const [password, setPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isAuthenticated); // Inicia como false se já autenticado

  // Buscar perfil para verificar cargo
  const { currentUser, isChecking } = useAuthGuard({
    fetchUserProfile: true,
    requireApproval: false, // Já deve estar aprovado se chegou aqui
    skip: isAuthenticated // Se já autenticado, pula verificação do AuthGuard
  });

  useEffect(() => {
    // Se ainda está verificando usuário, aguarda
    if (isChecking) return;

    // 1. Verificar se já autenticou via senha (sessionStorage)
    const authStatus = sessionStorage.getItem(STORAGE_KEY_AUTH);
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    // 2. Verificar se tem cargo de Marketing ou superior (bypass senha)
    if (currentUser?.role && ['marketing', 'admin', 'master'].includes(currentUser.role)) {
      setIsAuthenticated(true);
      // Opcional: Salvar na session para evitar check repetido, 
      // mas como depende do usuário, melhor deixar dinâmico ou salvar também.
      // sessionStorage.setItem(STORAGE_KEY_AUTH, 'true'); // Deixar sem salvar para garantir check de role sempre que recarregar, ou salvar pelo conforto.
      // Vamos salvar para manter consistência com o comportamento da senha.
      sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
      setLoading(false);
      return;
    }

    // Se chegou aqui, não está autenticado e não tem cargo suficiente
    setLoading(false);
  }, [isChecking, currentUser]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (password === SENHA_VALORES_CIDADE) {
      setIsAuthenticated(true);
      sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
      setPassword('');
    } else {
      setPasswordError('Senha incorreta. Tente novamente.');
      setPassword('');
    }
  };

  return {
    isAuthenticated,
    password,
    passwordError,
    // Loading é true se: local loading é true OU auth guard checking é true
    // Mas se já autenticado via session, local loading vira false rápido.
    // Vamos manter loading local sincronizado com efeito.
    // Loading é true se: ainda está fazendo check locais ou se auth guard está checando
    // MAS, se já estivermos autenticados (via session storage ou cache), não precisamos mostrar loading
    loading: !isAuthenticated && (loading || isChecking),
    setPassword,
    handlePasswordSubmit,
  };
};

