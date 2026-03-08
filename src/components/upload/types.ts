import React from 'react';

export interface UploadSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  files: File[];
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onUpload: () => void;
  uploading: boolean;
  progress: number;
  progressLabel?: string;
  message: string;
  disabled?: boolean;
  variant?: 'default' | 'marketing' | 'valores';
  dataAttribute?: string;
  maxFiles?: number;
  gradientFrom?: string; // Mantido para compatibilidade, mas não usado
  gradientTo?: string; // Mantido para compatibilidade, mas não usado
  tips?: Array<{ icon?: string; text: string }>;
  expectedColumns?: string[];
  // Props for MV refresh progress
  isRefreshingMVs?: boolean;
  mvRefreshProgress?: number;
  mvRefreshStatus?: string;
}
