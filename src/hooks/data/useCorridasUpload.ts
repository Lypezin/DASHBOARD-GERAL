/**
 * Hook para gerenciar upload de arquivos de corridas
 * Re-exporta lógica modularizada
 */

import { useUploadRefresh } from './useUploadRefresh';
import { useFileSelection } from '@/hooks/upload/useFileSelection';
import { useUploadProcessor } from '@/hooks/upload/useUploadProcessor';

interface UseCorridasUploadProps {
  organizationId?: string;
}

export function useCorridasUpload({ organizationId }: UseCorridasUploadProps = {}) {
  const { files, handleFileChange, removeFile, clearFiles } = useFileSelection();
  const { state, setState, processUpload } = useUploadProcessor(organizationId);
  const { startAutoRefresh, isRefreshing, refreshProgress, refreshStatus } = useUploadRefresh();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e, (msg) => setState(prev => ({ ...prev, message: msg })));
  };

  const handleUpload = () => {
    processUpload(files, () => {
      clearFiles();
      startAutoRefresh(true);
    });
  };

  return {
    files,
    ...state,
    handleFileChange: onFileChange,
    removeFile,
    handleUpload,
    isRefreshingMVs: isRefreshing,
    mvRefreshProgress: refreshProgress,
    mvRefreshStatus: refreshStatus
  };
}
