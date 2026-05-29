/**
 * Funções de validação de arquivos para upload
 */

import { safeLog } from '@/lib/errorHandler';
import { MAX_FILE_SIZE, MAX_FILES, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, EXCEL_SIGNATURES } from '@/constants/upload';

const IS_DEV = process.env.NODE_ENV === 'development';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida um arquivo antes do upload
 * @param file Arquivo a ser validado
 * @param currentFileCount Número atual de arquivos já selecionados
 * @returns Resultado da validação
 */
export async function validateFile(
  file: File,
  currentFileCount: number = 0
): Promise<FileValidationResult> {
  // Validar quantidade de arquivos
  if (currentFileCount >= MAX_FILES) {
    return { valid: false, error: `Máximo de ${MAX_FILES} arquivos permitidos por upload.` };
  }

  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Arquivo "${file.name}" excede o tamanho máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB.` };
  }

  if (file.size === 0) {
    return { valid: false, error: `Arquivo "${file.name}" está vazio.` };
  }

  // Validar extensão
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: `Extensão "${extension}" não permitida. Use apenas .xlsx, .xls ou .xlsm.` };
  }

  // Validar tipo MIME (se disponível)
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `Tipo de arquivo "${file.type}" não permitido.` };
  }

  // Validar magic bytes (assinatura do arquivo)
  // Nota: Esta validação é uma verificação básica. A validação real será feita pela biblioteca XLSX ao tentar ler o arquivo.
  try {
    const arrayBuffer = await file.slice(0, 8).arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const signature = Array.from(uint8Array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    // Verificar assinaturas conhecidas
    const isZipSignature = signature.startsWith(EXCEL_SIGNATURES.XLSX); // ZIP (XLSX)
    const isOle2Signature = signature.startsWith(EXCEL_SIGNATURES.XLS.substring(0, 8)); // OLE2 (XLS antigo)
    
    // Se não for uma assinatura conhecida, mas a extensão está correta, permitir
    // A biblioteca XLSX fará a validação real ao tentar ler o arquivo
    if (!isZipSignature && !isOle2Signature) {
      // Log para debug em desenvolvimento
      if (IS_DEV) {
        safeLog.warn(`⚠️ Assinatura não reconhecida para "${file.name}": ${signature.substring(0, 16)}`);
        safeLog.info(`   Mas a extensão está correta (${extension}), permitindo. A biblioteca XLSX validará ao ler.`);
      }
      // Não bloquear - a extensão já foi validada e a XLSX fará a validação real
    } else {
      if (IS_DEV) {
        safeLog.info(`✓ Assinatura válida para "${file.name}": ${isZipSignature ? 'XLSX (ZIP)' : 'XLS (OLE2)'}`);
      }
    }
  } catch (err) {
    // Se houver erro ao ler os bytes, não bloquear - deixar a biblioteca XLSX validar
    // Isso pode acontecer com alguns arquivos ou em certos navegadores
    if (IS_DEV) {
      safeLog.warn(`⚠️ Erro ao validar assinatura do arquivo "${file.name}":`, err);
      safeLog.info(`   Mas a extensão está correta (${extension}), permitindo. A biblioteca XLSX validará ao ler.`);
    }
    // Não bloquear - a extensão já foi validada
  }

  return { valid: true };
}

