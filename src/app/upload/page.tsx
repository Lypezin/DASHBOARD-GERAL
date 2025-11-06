'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabaseClient';

const COLUMN_MAP: { [key: string]: string } = {
  data_do_periodo: 'data_do_periodo',
  periodo: 'periodo',
  duracao_do_periodo: 'duracao_do_periodo',
  numero_minimo_de_entregadores_regulares_na_escala: 'numero_minimo_de_entregadores_regulares_na_escala',
  tag: 'tag',
  id_da_pessoa_entregadora: 'id_da_pessoa_entregadora',
  pessoa_entregadora: 'pessoa_entregadora',
  praca: 'praca',
  sub_praca: 'sub_praca',
  origem: 'origem',
  tempo_disponivel_escalado: 'tempo_disponivel_escalado',
  tempo_disponivel_absoluto: 'tempo_disponivel_absoluto',
  numero_de_corridas_ofertadas: 'numero_de_corridas_ofertadas',
  numero_de_corridas_aceitas: 'numero_de_corridas_aceitas',
  numero_de_corridas_rejeitadas: 'numero_de_corridas_rejeitadas',
  numero_de_corridas_completadas: 'numero_de_corridas_completadas',
  numero_de_corridas_canceladas_pela_pessoa_entregadora: 'numero_de_corridas_canceladas_pela_pessoa_entregadora',
  numero_de_pedidos_aceitos_e_concluidos: 'numero_de_pedidos_aceitos_e_concluidos',
  soma_das_taxas_das_corridas_aceitas: 'soma_das_taxas_das_corridas_aceitas',
};

const BATCH_SIZE = 500;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10; // Máximo de arquivos por upload
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
];
const ALLOWED_EXTENSIONS = ['xlsx', 'xls', 'xlsm'];

// Assinaturas de arquivo (magic bytes)
const EXCEL_SIGNATURES = {
  XLSX: '504b0304', // ZIP signature (XLSX é um arquivo ZIP)
  XLS: 'd0cf11e0a1b11ae1', // OLE2 signature (XLS antigo)
};

function excelSerialToISODate(serial: number): string {
  const utc_days = Math.floor(serial - 25569);
  const date_info = new Date(utc_days * 86400 * 1000);
  const year = date_info.getUTCFullYear();
  const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date_info.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function convertSecondsToHHMMSS(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function convertFractionToHHMMSS(fraction: number): string {
  const totalSeconds = Math.round(fraction * 86400);
  return convertSecondsToHHMMSS(totalSeconds);
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  const validateFile = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    // Validar quantidade de arquivos
    if (files.length >= MAX_FILES) {
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
    try {
      const arrayBuffer = await file.slice(0, 8).arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const signature = Array.from(uint8Array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();

      const isValidSignature = 
        signature.startsWith(EXCEL_SIGNATURES.XLSX) || 
        signature.startsWith(EXCEL_SIGNATURES.XLS);

      if (!isValidSignature) {
        return { valid: false, error: `Arquivo "${file.name}" não é um Excel válido.` };
      }
    } catch (err) {
      return { valid: false, error: `Erro ao validar arquivo "${file.name}".` };
    }

    return { valid: true };
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    // Validar quantidade total
    if (files.length + selectedFiles.length > MAX_FILES) {
      setMessage(`⚠️ Máximo de ${MAX_FILES} arquivos permitidos. Você tentou adicionar ${selectedFiles.length} arquivo(s), mas já tem ${files.length}.`);
      return;
    }

    // Validar cada arquivo
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of Array.from(selectedFiles)) {
      const validation = await validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(validation.error || `Arquivo "${file.name}" inválido.`);
      }
    }

    if (errors.length > 0) {
      setMessage(`⚠️ ${errors.length} arquivo(s) rejeitado(s):\n${errors.join('\n')}`);
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setMessage('');
      setProgress(0);
      setProgressLabel('');
      setCurrentFileIndex(0);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage('Por favor, selecione pelo menos um arquivo.');
      return;
    }

    setUploading(true);
    setMessage('');
    setProgress(0);
    setCurrentFileIndex(0);

    const totalFiles = files.length;
    let successCount = 0;
    let errorCount = 0;

    for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
      const file = files[fileIdx];
      setCurrentFileIndex(fileIdx + 1);
      setProgressLabel(`Processando arquivo ${fileIdx + 1}/${totalFiles}: ${file.name}`);

      try {
        const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { raw: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

      setProgressLabel('Processando dados...');
      setProgress(10);

      const sanitizedData = rawData
        .map((row: any) => {
          const sanitized: any = {};
          for (const excelCol in COLUMN_MAP) {
            const dbCol = COLUMN_MAP[excelCol];
            let value = row[excelCol];

            if (dbCol === 'data_do_periodo') {
              if (typeof value === 'number') {
                value = excelSerialToISODate(value);
              } else if (value instanceof Date) {
                const yyyy = value.getFullYear();
                const mm = String(value.getMonth() + 1).padStart(2, '0');
                const dd = String(value.getDate()).padStart(2, '0');
                value = `${yyyy}-${mm}-${dd}`;
              }
            }

            if (dbCol === 'tempo_disponivel_escalado') {
              if (typeof value === 'number') {
                value = convertSecondsToHHMMSS(value);
              }
            }

            if (dbCol === 'duracao_do_periodo' || dbCol === 'tempo_disponivel_absoluto') {
              if (typeof value === 'number') {
                value = convertFractionToHHMMSS(value);
              } else if (value instanceof Date) {
                const h = value.getHours();
                const m = value.getMinutes();
                const s = value.getSeconds();
                value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
              } else if (typeof value === 'string' && value.includes('T')) {
                const timeMatch = value.match(/T(\d{2}):(\d{2}):(\d{2})/);
                if (timeMatch) {
                  value = `${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3]}`;
                }
              }
            }

            sanitized[dbCol] = value === null || value === undefined || value === '' ? null : value;
          }
          return sanitized;
        })
        .filter((row: any) => {
          const hasData = Object.values(row).some((v) => v !== null && v !== undefined && v !== '');
          return hasData;
        });

        const totalRows = sanitizedData.length;
        let insertedRows = 0;

        const fileProgress = (fileIdx / totalFiles) * 100;
        setProgress(fileProgress);

        for (let i = 0; i < totalRows; i += BATCH_SIZE) {
          const batch = sanitizedData.slice(i, i + BATCH_SIZE);
          const { error: batchError } = await supabase.from('dados_corridas').insert(batch, { count: 'exact' });

          if (batchError) {
            throw new Error(`Erro no lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batchError.message}`);
          }

          insertedRows += batch.length;
          const batchProgress = (insertedRows / totalRows) * (100 / totalFiles);
          setProgress(fileProgress + batchProgress);
          setProgressLabel(`Arquivo ${fileIdx + 1}/${totalFiles}: ${insertedRows}/${totalRows} linhas`);
        }

        successCount++;
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`Erro no arquivo ${file.name}:`, error);
        }
        errorCount++;
      }
    }

    setProgress(100);
    setProgressLabel('Concluído!');
    
    if (errorCount === 0) {
      setMessage(`✅ Todos os ${successCount} arquivo(s) foram importados com sucesso! 
        
⏳ Aguarde alguns minutos para os dados agregados serem processados, depois atualize a página.

💡 Dica: Com grandes volumes de dados, o processamento pode levar até 10 minutos. Você pode fechar esta página e voltar mais tarde.`);
    } else {
      setMessage(`⚠️ ${successCount} arquivo(s) importado(s) com sucesso, ${errorCount} com erro. Verifique os logs.`);
    }
    
    // Tentar refresh assíncrono da materialized view (não bloqueia o upload)
    try {
      // Usar setTimeout para não bloquear a UI
      setTimeout(async () => {
        try {
          await supabase.rpc('refresh_mv_aderencia_async');
          if (process.env.NODE_ENV === 'development') {
            console.log('Refresh da materialized view iniciado em segundo plano');
          }
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Refresh assíncrono não disponível, será processado automaticamente');
          }
        }
      }, 1000);
    } catch (e) {
      // Silenciar erros - o refresh será feito automaticamente
    }

    setFiles([]);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Card Principal */}
          <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-2xl dark:border-blue-900 dark:bg-slate-900">
            {/* Header do Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <span className="text-4xl">📊</span>
              </div>
              <h1 className="text-3xl font-bold text-white">Upload de Dados</h1>
              <p className="mt-2 text-blue-100">Importe sua planilha Excel para o sistema</p>
            </div>

            {/* Conteúdo */}
            <div className="p-8">
              {/* Área de Upload */}
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  multiple
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
                <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-12 text-center transition-all duration-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-100 hover:to-indigo-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 dark:border-blue-700 dark:from-blue-950/30 dark:to-indigo-950/30 dark:hover:border-blue-600">
                  {files.length === 0 ? (
                    <div className="space-y-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <span className="text-3xl">📁</span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                          Clique para selecionar ou arraste os arquivos aqui
                        </p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          Você pode selecionar múltiplos arquivos de uma vez
                        </p>
                        <p className="mt-1 text-xs text-slate-400">Formatos aceitos: .xlsx, .xls</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <span className="text-3xl">✅</span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                          {files.length} arquivo(s) selecionado(s)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de Arquivos */}
              {files.length > 0 && !uploading && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="rounded-lg bg-rose-100 p-2 text-rose-600 transition-colors hover:bg-rose-200 dark:bg-rose-950/30 dark:text-rose-400"
                      >
                        <span>🗑️</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Botão de Upload */}
              <button
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
                className="mt-6 w-full transform rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>
                      {currentFileIndex > 0 && `Arquivo ${currentFileIndex}/${files.length} - `}
                      Processando...
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">🚀</span>
                    <span>Enviar {files.length} Arquivo(s)</span>
                  </div>
                )}
              </button>

              {/* Barra de Progresso */}
              {uploading && (
                <div className="mt-6 space-y-3 animate-in fade-in duration-300">
                  <div className="overflow-hidden rounded-full bg-slate-200 shadow-inner dark:bg-slate-800">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-lg transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  {progressLabel && (
                    <div className="text-center">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{progressLabel}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{progress.toFixed(1)}% concluído</p>
                    </div>
                  )}
                </div>
              )}

              {/* Mensagem de Status */}
              {message && (
                <div
                  className={`mt-6 animate-in fade-in slide-in-from-top-2 rounded-xl border-2 p-4 duration-300 ${
                    message.includes('✅')
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                      : message.includes('❌')
                      ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
                      : 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200'
                  }`}
                >
                  <p className="font-medium">{message}</p>
                </div>
              )}

              {/* Informações e Dicas */}
              <div className="mt-8 rounded-xl bg-blue-50 p-6 dark:bg-blue-950/30">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900 dark:text-blue-100">Dicas importantes</h3>
                    <ul className="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-blue-600">•</span>
                        <span>Certifique-se de que a planilha contém todas as colunas necessárias</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-blue-600">•</span>
                        <span>O sistema processa automaticamente grandes volumes de dados</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-blue-600">•</span>
                        <span>Aguarde a conclusão do upload antes de navegar para outra página</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-blue-600">•</span>
                        <span>Após o upload, os dados estarão disponíveis imediatamente no dashboard</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Colunas Esperadas */}
              <details className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  📋 Ver colunas esperadas na planilha
                </summary>
                <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  {Object.keys(COLUMN_MAP).map((col) => (
                    <div key={col} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 dark:bg-slate-900">
                      <span className="text-blue-600">✓</span>
                      <code className="text-xs text-slate-700 dark:text-slate-300">{col}</code>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}