import React from 'react';
import { UploadActions } from './components/UploadActions';
import { UploadTips } from './components/UploadTips';
import { UploadExpectedColumns } from './components/UploadExpectedColumns';

interface UploadSectionFooterProps {
  onUpload: () => void | Promise<void>;
  uploading: boolean;
  fileCount: number;
  disabled?: boolean;
  variant: 'default' | 'marketing' | 'valores';
  tips?: Array<{ icon?: string; text: string }>;
  expectedColumns?: string[];
}

export const UploadSectionFooter: React.FC<UploadSectionFooterProps> = ({
  onUpload, uploading, fileCount, disabled = false, variant, tips, expectedColumns
}) => {
  return (
    <div className="mt-auto space-y-6">
      <UploadActions 
        onUpload={onUpload} 
        uploading={uploading} 
        hasFiles={fileCount > 0} 
        disabled={disabled}
        variant={variant} 
        fileCount={fileCount} 
      />

      {/* Informações e Dicas - Less intrusive */}
      <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity">
        <UploadTips tips={tips} />
        <UploadExpectedColumns columns={expectedColumns} />
      </div>
    </div>
  );
};
