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
    <div className="container mx-auto max-w-2xl">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Upload de Planilha</h1>
        <div className="flex flex-col items-center space-y-4">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={uploading}
          />
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Enviando...' : 'Enviar Dados'}
          </button>
          
          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          )}

          {progressLabel && <p className="text-xs text-gray-500">{progressLabel}</p>}

          {message && <p className="text-sm text-center mt-4">{message}</p>}
        </div>
      </div>
    </div>
  );
}
