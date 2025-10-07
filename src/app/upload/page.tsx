"use client";

import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabaseClient';

// Mapeamento completo baseado nas colunas reais da planilha
const COLUMN_MAP: { [key: string]: string } = {
  'data_do_periodo': 'data_do_periodo',
  'periodo': 'periodo',
  'duracao_do_periodo': 'duracao_do_periodo',
  'numero_minimo_de_entregadores_regulares_na_escala': 'numero_minimo_de_entregadores_regulares_na_escala',
  'tag': 'tag',
  'id_da_pessoa_entregadora': 'id_da_pessoa_entregadora',
  'pessoa_entregadora': 'pessoa_entregadora',
  'praca': 'praca',
  'sub_praca': 'sub_praca',
  'origem': 'origem',
  'tempo_disponivel_escalado': 'tempo_disponivel_escalado',
  'tempo_disponivel_absoluto': 'tempo_disponivel_absoluto',
  'numero_de_corridas_ofertadas': 'numero_de_corridas_ofertadas',
  'numero_de_corridas_aceitas': 'numero_de_corridas_aceitas',
  'numero_de_corridas_rejeitadas': 'numero_de_corridas_rejeitadas',
  'numero_de_corridas_completadas': 'numero_de_corridas_completadas',
  'numero_de_corridas_canceladas_pela_pessoa_entregadora': 'numero_de_corridas_canceladas_pela_pessoa_entregadora',
  'numero_de_pedidos_aceitos_e_concluidos': 'numero_de_pedidos_aceitos_e_concluidos',
  'soma_das_taxas_das_corridas_aceitas': 'soma_das_taxas_das_corridas_aceitas',
};


const EXCEL_EPOCH_OFFSET = 25569;
const SECONDS_IN_DAY = 86400;
const MAX_DEBUG_ROWS = 5;

const convertSecondsToHHMMSS = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.max(0, totalSeconds % 60);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const convertFractionToHHMMSS = (fraction: number): string => {
  const totalSeconds = Math.round(fraction * SECONDS_IN_DAY);
  return convertSecondsToHHMMSS(totalSeconds);
};

const excelSerialToISODate = (serial: number): string | null => {
  if (Number.isNaN(serial) || serial <= 0) return null;
  const date = new Date((serial - EXCEL_EPOCH_OFFSET) * SECONDS_IN_DAY * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
};


export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [totalRows, setTotalRows] = useState<number | null>(null);
  const [insertedRows, setInsertedRows] = useState(0);

  const progressLabel = useMemo(() => {
    if (uploading && totalRows) {
      return `${insertedRows}/${totalRows} registros enviados`;
    }
    return '';
  }, [insertedRows, totalRows, uploading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Por favor, selecione um arquivo Excel.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setMessage('Lendo o arquivo...');
    setInsertedRows(0);
    setTotalRows(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // ========== PROCESSAMENTO SIMPLIFICADO ==========
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, {
          raw: true,
          defval: null,
        });

        console.log('📊 Dados brutos do Excel (primeiras linhas):', JSON.stringify(json.slice(0, MAX_DEBUG_ROWS), null, 2));

        const processedData = json.map((row, index) => {
          const newRow: { [key: string]: any } = {};

          for (const excelHeader in row) {
             // Normalização básica do cabeçalho
             const normalizedKey = excelHeader
               .trim()
               .toLowerCase()
               .normalize('NFD')
               .replace(/[\u0300-\u036f]/g, '') // remove acentos
               .replace(/\s+/g, '_');

             if (COLUMN_MAP[normalizedKey]) {
                const targetColumn = COLUMN_MAP[normalizedKey];
                const value = row[excelHeader];

                // Tratamento específico para data_do_periodo (número de série do Excel)
                if (targetColumn === 'data_do_periodo') {
                  if (typeof value === 'number') {
                    const isoDate = excelSerialToISODate(value);
                    newRow[targetColumn] = isoDate ?? value;
                    if (index < MAX_DEBUG_ROWS) {
                      console.log(`   🔄 data_do_periodo: ${value} → ${newRow[targetColumn]}`);
                    }
                  } else {
                    newRow[targetColumn] = value;
                  }
                }
                // Para colunas de tempo, aplicar conversão correta baseada no formato
                else if (['duracao_do_periodo', 'tempo_disponivel_escalado', 'tempo_disponivel_absoluto'].includes(targetColumn)) {
                  if (value === null || value === undefined || value === '') {
                    newRow[targetColumn] = null;
                  } else if (typeof value === 'number') {
                    // Aplicar lógica de conversão baseada no tipo de coluna
                    if (targetColumn === 'tempo_disponivel_escalado') {
                      const totalSeconds = Math.round(value);
                      newRow[targetColumn] = convertSecondsToHHMMSS(totalSeconds);
                      if (index < MAX_DEBUG_ROWS) {
                        console.log(`   🔄 ${targetColumn}: ${value} segundos → ${newRow[targetColumn]}`);
                      }
                    } else {
                      newRow[targetColumn] = convertFractionToHHMMSS(value);
                      if (index < MAX_DEBUG_ROWS) {
                        console.log(`   🔄 ${targetColumn}: ${value} (fração) → ${newRow[targetColumn]}`);
                      }
                    }
                  } else {
                    newRow[targetColumn] = String(value);
                  }
                } else {
                  newRow[targetColumn] = value;
                }
             }
          }

          return newRow;
        });

        const sanitizedData = processedData.filter((row) =>
          Object.values(row).some((value) => value !== null && value !== ''),
        );

        console.log(
          '📤 Dados processados para o banco:',
          JSON.stringify(sanitizedData.slice(0, MAX_DEBUG_ROWS), null, 2),
        );
        if (sanitizedData.length > MAX_DEBUG_ROWS) {
          console.log(`... +${sanitizedData.length - MAX_DEBUG_ROWS} linhas adicionais`);
        }

        if (sanitizedData.length === 0) {
          setMessage('Nenhum registro válido encontrado no arquivo.');
          setUploading(false);
          return;
        }

        setTotalRows(sanitizedData.length);
        setMessage(`Enviando ${sanitizedData.length} registros...`);

        const BATCH_SIZE = 500; // Supabase recomenda até ~500 registros por batch
        let totalInserted = 0;

        for (let i = 0; i < sanitizedData.length; i += BATCH_SIZE) {
          const batch = sanitizedData.slice(i, i + BATCH_SIZE);

          const { count, error } = await supabase
            .from('dados_corridas')
            .insert(batch, { count: 'exact' });

          if (error) {
            console.error("Erro detalhado:", error);
            
            // Para debug: imprimir o primeiro registro do lote que falhou
            if (batch.length > 0) {
              console.error("Exemplo do primeiro registro que falhou:", JSON.stringify(batch[0]));
            }
            
            throw new Error(`Erro no lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
          }
          
          totalInserted += count ?? batch.length;
          setProgress((totalInserted / sanitizedData.length) * 100);
          setInsertedRows(totalInserted);
        }

        setMessage(`Upload concluído com sucesso! ${totalInserted} registros inseridos.`);
        setProgress(100);
      } catch (error: any) {
        console.error('Erro no upload:', error);
        setMessage(`Erro: ${error.message}`);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-12 flex justify-center">
        <div className="w-full max-w-2xl">
          <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl border border-blue-200 dark:border-blue-900/40 p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
                <span className="text-3xl text-white">📊</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Selecione sua planilha</h2>
              <p className="text-gray-600 dark:text-gray-400">Formatos suportados: .xlsx, .xls</p>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-600 dark:text-gray-300 
                           file:mr-4 file:py-4 file:px-6 file:rounded-xl file:border-0 
                           file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-indigo-600 
                           file:text-white file:shadow-lg hover:file:from-blue-600 hover:file:to-indigo-700 
                           file:transition-all file:duration-200 file:cursor-pointer
                           border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl p-6
                           hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                  disabled={uploading}
                />
                {!file && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📁</div>
                      <p className="text-gray-500 dark:text-gray-400">Clique para selecionar ou arraste aqui</p>
                    </div>
                  </div>
                )}
              </div>

              {file && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-200">Arquivo selecionado:</p>
                      <p className="text-green-700 dark:text-green-300 text-sm">{file.name}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl 
                         hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 
                         disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 
                         transform hover:-translate-y-1 disabled:transform-none"
              >
                {uploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Enviando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>🚀</span>
                    <span>Enviar Dados</span>
                  </div>
                )}
              </button>
              
              {uploading && (
                <div className="space-y-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full shadow-sm transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  {progressLabel && (
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{progressLabel}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Progresso: {progress.toFixed(1)}%</p>
                    </div>
                  )}
                </div>
              )}

              {message && (
                <div className={`p-4 rounded-xl border-2 ${
                  message.includes('sucesso') 
                    ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200' 
                    : message.includes('Erro') 
                    ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200'
                    : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {message.includes('sucesso') ? '✅' : message.includes('Erro') ? '❌' : 'ℹ️'}
                    </span>
                    <p className="font-medium">{message}</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Dicas importantes:</h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Certifique-se de que a planilha contém todas as colunas necessárias</li>
                  <li>• O sistema suporta grandes volumes de dados</li>
                  <li>• O upload pode levar alguns minutos para arquivos grandes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
