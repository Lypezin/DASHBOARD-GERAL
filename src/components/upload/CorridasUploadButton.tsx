/**
 * Componente de botão de upload para corridas
 */

interface CorridasUploadButtonProps {
  filesCount: number;
  uploading: boolean;
  currentFileIndex: number;
  onClick: () => void;
}

export function CorridasUploadButton({
  filesCount,
  uploading,
  currentFileIndex,
  onClick,
}: CorridasUploadButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={uploading || filesCount === 0}
      className="mt-6 w-full transform rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
    >
      {uploading ? (
        <div className="flex items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          <span>
            {currentFileIndex > 0 && `Arquivo ${currentFileIndex}/${filesCount} - `}
            Processando...
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-3">
          <span className="text-xl">🚀</span>
          <span>Enviar {filesCount} Arquivo(s)</span>
        </div>
      )}
    </button>
  );
}

