export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Por favor, selecione apenas arquivos de imagem.' };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'A imagem deve ter no máximo 5MB.' };
  }

  return { valid: true };
};
