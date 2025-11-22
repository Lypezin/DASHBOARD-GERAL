import { useState, useEffect } from 'react';

const SENHA_VALORES_CIDADE = 'F4S@1S';
const STORAGE_KEY_AUTH = 'valores_cidade_authenticated';

export const useValoresCidadeAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authStatus = sessionStorage.getItem(STORAGE_KEY_AUTH);
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

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
    loading,
    setPassword,
    handlePasswordSubmit,
  };
};

