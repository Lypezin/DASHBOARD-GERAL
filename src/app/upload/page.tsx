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
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

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

        // Adicionado para corrigir o formato de data para colunas de intervalo
        const intervalColumns = [
          'duracao_do_periodo',
          'tempo_disponivel_escalado',
          'tempo_disponivel_absoluto'
        ];

        const processedData = normalizedJson.map(row => {
          const newRow = { ...row };
          for (const col of intervalColumns) {
            if (newRow[col] && newRow[col] instanceof Date) {
              const date = newRow[col];
              // Formata para HH:MM:SS. Usamos UTC para evitar problemas de fuso horário
              // com a data base do Excel (1899-12-30).
              const hours = String(date.getUTCHours()).padStart(2, '0');
              const minutes = String(date.getUTCMinutes()).padStart(2, '0');
              const seconds = String(date.getUTCSeconds()).padStart(2, '0');
              newRow[col] = `${hours}:${minutes}:${seconds}`;
            }
          }
          return newRow;
        });


        setMessage(`Enviando ${processedData.length} registros...`);

        const BATCH_SIZE = 500; // O Supabase recomenda lotes de até 1000, 500 é seguro.
        let totalInserted = 0;

        for (let i = 0; i < processedData.length; i += BATCH_SIZE) {
          const batch = processedData.slice(i, i + BATCH_SIZE);
          
          const { error } = await supabase.from('dados_corridas').insert(batch);

          if (error) {
            throw new Error(`Erro no lote ${i / BATCH_SIZE + 1}: ${error.message}`);
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
