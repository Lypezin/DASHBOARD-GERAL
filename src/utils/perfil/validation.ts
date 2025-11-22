export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Por favor, selecione apenas arquivos de imagem.' };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'A imagem deve ter no máximo 5MB.' };
  }

  return { valid: true };
};

export const validateFullName = (name: string): { valid: boolean; error?: string } => {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'O nome não pode estar vazio.' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'O nome deve ter no máximo 100 caracteres.' };
  }

  return { valid: true };
};

