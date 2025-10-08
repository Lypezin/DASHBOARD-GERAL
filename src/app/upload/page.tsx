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
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage('');
      setProgress(0);
      setProgressLabel('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Por favor, selecione um arquivo.');
      return;
    }

    setUploading(true);
    setMessage('');
    setProgress(0);
    setProgressLabel('Lendo arquivo...');

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

      setProgressLabel(`Enviando dados (0/${totalRows})...`);
      setProgress(20);

      for (let i = 0; i < totalRows; i += BATCH_SIZE) {
        const batch = sanitizedData.slice(i, i + BATCH_SIZE);
        const { error: batchError } = await supabase.from('dados_corridas').insert(batch, { count: 'exact' });

        if (batchError) {
          throw new Error(`Erro no lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batchError.message}`);
        }

        insertedRows += batch.length;
        const progressPercent = 20 + (insertedRows / totalRows) * 70;
        setProgress(progressPercent);
        setProgressLabel(`Enviando dados (${insertedRows}/${totalRows})...`);
      }

      setProgressLabel('Atualizando materialized view...');
      setProgress(95);

      const { error: refreshError } = await supabase.rpc('refresh_mv_aderencia');
      if (refreshError) {
        console.warn('Erro ao atualizar materialized view:', refreshError);
      }

      setProgress(100);
      setProgressLabel('Concluído!');
      setMessage(`✅ Upload concluído com sucesso! ${insertedRows} linhas inseridas.`);
      setFile(null);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Erro no upload:', error);
      setMessage(`❌ Erro no upload: ${error.message}`);
      setProgress(0);
      setProgressLabel('');
    } finally {
      setUploading(false);
    }
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
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
                <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-12 text-center transition-all duration-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-100 hover:to-indigo-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 dark:border-blue-700 dark:from-blue-950/30 dark:to-indigo-950/30 dark:hover:border-blue-600">
                  {!file ? (
                    <div className="space-y-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <span className="text-3xl">📁</span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                          Clique para selecionar ou arraste o arquivo aqui
                        </p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Formatos aceitos: .xlsx, .xls</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <span className="text-3xl">✅</span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">Arquivo selecionado</p>
                        <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">{file.name}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botão de Upload */}
              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="mt-6 w-full transform rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Processando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">🚀</span>
                    <span>Enviar Dados</span>
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