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
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        // Lógica de processamento simplificada após mudança no DB para TEXT
        const processedData = json.map(row => {
          const newRow: {[key: string]: any} = {};
          // Normaliza os cabeçalhos e garante que todos os valores sejam do tipo certo
          for (const key in row) {
             const normalizedKey = key.trim().toLowerCase().replace(/ /g, '_');
             if (COLUMN_MAP[normalizedKey]) {
                const value = row[key];
                const targetColumn = COLUMN_MAP[normalizedKey];

                if (['duracao_do_periodo', 'tempo_disponivel_escalado', 'tempo_disponivel_absoluto'].includes(targetColumn)) {
                  // Se for um objeto Date, extrai a hora. Senão, converte para string.
                  if (value instanceof Date) {
                    const hours = String(value.getUTCHours()).padStart(2, '0');
                    const minutes = String(value.getUTCMinutes()).padStart(2, '0');
                    const seconds = String(value.getUTCSeconds()).padStart(2, '0');
                    newRow[targetColumn] = `${hours}:${minutes}:${seconds}`;
                  } else if (value !== null && value !== undefined) {
                    newRow[targetColumn] = String(value);
                  }
                } else if (targetColumn === 'data_do_periodo' && value instanceof Date) {
                  newRow[targetColumn] = value.toISOString().split('T')[0];
                } else {
                  newRow[targetColumn] = value;
                }
             }
          }
          return newRow;
        });

        setMessage(`Enviando ${processedData.length} registros...`);

        const BATCH_SIZE = 100; // Lote menor para mais segurança
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
