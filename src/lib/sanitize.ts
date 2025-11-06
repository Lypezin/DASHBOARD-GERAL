/**
 * Funções de sanitização para prevenir XSS e outros ataques
 */

/**
 * Sanitiza texto removendo caracteres perigosos
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza HTML (remove tags e atributos perigosos)
 * Para uso quando você precisa permitir algum HTML
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  
  // Versão simples - remove todas as tags HTML
  // Para uma versão mais robusta, use uma biblioteca como DOMPurify
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '');
}

/**
 * Sanitiza nome de arquivo removendo caracteres perigosos
 */
export function sanitizeFilename(filename: string): string {
  return String(filename)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+/, '') // Remove pontos no início
    .substring(0, 255); // Limita tamanho
}

/**
 * Valida e sanitiza URL
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    // Permitir apenas http e https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

