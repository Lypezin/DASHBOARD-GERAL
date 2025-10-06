"use client";

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabaseClient';

// Mapeamento para garantir que os nomes das colunas sejam consistentes
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


export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

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

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        // A opção `cellDates: true` deve estar aqui para que a biblioteca interprete as datas do Excel corretamente.
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Obter JSON da planilha
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        setMessage("Normalizando dados...");

        // Normaliza os cabeçalhos para remover espaços e caracteres especiais
        const normalizedJson = json.map(row => {
          const newRow: {[key: string]: any} = {};
          for (const key in row) {
             const normalizedKey = key.trim().toLowerCase().replace(/ /g, '_');
             if (COLUMN_MAP[normalizedKey]) {
                newRow[COLUMN_MAP[normalizedKey]] = row[key];
             }
          }
          return newRow;
        });

        // SOLUÇÃO DEFINITIVA: Garantir que todas as colunas críticas sejam strings formatadas corretamente
        setMessage("Processando formatos de dados...");

        const processedData = normalizedJson.map((row, index) => {
          // Clone o objeto para não modificar o original
          const newRow = { ...row };

          // Lista de colunas que devem ser formatadas como "HH:MM:SS"
          const timeColumns = [
            'duracao_do_periodo',
            'tempo_disponivel_escalado',
            'tempo_disponivel_absoluto'
          ];
            
          try {
            // Processar a data de período
            if (newRow.data_do_periodo !== undefined) {
              // Se for uma data JS, converta para string ISO
              if (newRow.data_do_periodo instanceof Date) {
                newRow.data_do_periodo = newRow.data_do_periodo.toISOString().split('T')[0];
              }
              // Se for uma string de data completa, pegue apenas a parte da data
              else if (typeof newRow.data_do_periodo === 'string' && newRow.data_do_periodo.includes('T')) {
                newRow.data_do_periodo = newRow.data_do_periodo.split('T')[0];
              }
            }

            // Força o formato correto para todas as colunas de tempo
            timeColumns.forEach(colName => {
              // Pular se a coluna não existir ou for nula
              if (newRow[colName] === undefined || newRow[colName] === null) return;

              let timeValue = newRow[colName];
              let hours = 0;
              let minutes = 0;
              let seconds = 0;

              // CASO 1: É um objeto Date do JS
              if (timeValue instanceof Date) {
                hours = timeValue.getUTCHours();
                minutes = timeValue.getUTCMinutes();
                seconds = timeValue.getUTCSeconds();
              }
              // CASO 2: É um número (fração de um dia no Excel)
              else if (typeof timeValue === 'number') {
                // Converter da representação Excel (fração de 24 horas)
                const totalSeconds = Math.round(timeValue * 86400); // 86400 segundos em um dia
                hours = Math.floor(totalSeconds / 3600);
                minutes = Math.floor((totalSeconds % 3600) / 60);
                seconds = totalSeconds % 60;
              }
              // CASO 3: É uma string ISO de data (1899-12-30T07:05:28.000Z)
              else if (typeof timeValue === 'string' && timeValue.includes('T')) {
                const dateParts = timeValue.split('T');
                if (dateParts.length > 1) {
                  const timePart = dateParts[1].split('.')[0]; // Remover milissegundos se existirem
                  const [h, m, s] = timePart.split(':').map(Number);
                  hours = h || 0;
                  minutes = m || 0;
                  seconds = s || 0;
                }
              }
              // CASO 4: Já é uma string de tempo (07:05:28)
              else if (typeof timeValue === 'string' && timeValue.includes(':')) {
                const [h, m, s] = timeValue.split(':').map(Number);
                hours = h || 0;
                minutes = m || 0;
                seconds = s || 0;
              }

              // Formata para HH:MM:SS garantindo zeros à esquerda
              newRow[colName] = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            });

            return newRow;
          } catch (err) {
            console.error(`Erro ao processar a linha ${index}:`, err);
            // Em caso de erro, tentar garantir pelo menos um formato básico
            timeColumns.forEach(col => {
              if (newRow[col]) newRow[col] = '00:00:00';
            });
            return newRow;
          }
        });

        setMessage(`Enviando ${processedData.length} registros...`);

        // Reduzindo o tamanho do lote para mais segurança
        const BATCH_SIZE = 100;
        let totalInserted = 0;

        for (let i = 0; i < processedData.length; i += BATCH_SIZE) {
          const batch = processedData.slice(i, i + BATCH_SIZE);
          
          const { error } = await supabase.from('dados_corridas').insert(batch);

          if (error) {
            console.error("Erro detalhado:", error);
            
            // Para debug: imprimir o primeiro registro do lote que falhou
            if (batch.length > 0) {
              console.error("Exemplo do primeiro registro que falhou:", JSON.stringify(batch[0]));
            }
            
            throw new Error(`Erro no lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
          }
          
          totalInserted += batch.length;
          setProgress((totalInserted / processedData.length) * 100);
        }

        setMessage(`Upload concluído com sucesso! ${totalInserted} registros inseridos.`);
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

          {message && <p className="text-sm text-center mt-4">{message}</p>}
        </div>
      </div>
    </div>
  );
}
