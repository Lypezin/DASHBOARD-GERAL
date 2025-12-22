import React, { forwardRef } from 'react';

interface ProfileAvatarUploaderProps {
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUpload: () => void;
    uploading: boolean;
    hasPreview: boolean;
}

export const ProfileAvatarUploader = forwardRef<HTMLInputElement, ProfileAvatarUploaderProps>(
    ({ onFileSelect, onUpload, uploading, hasPreview }, ref) => {
        return (
            <div className="flex-1 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Selecionar Imagem
                    </label>
                    <input
                        ref={ref}
                        type="file"
                        accept="image/*"
                        onChange={onFileSelect}
                        className="block w-full text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer dark:file:bg-blue-500 dark:hover:file:bg-blue-600"
                        disabled={uploading}
                    />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
                    </p>
                </div>

                {hasPreview && (
                    <button
                        onClick={onUpload}
                        disabled={uploading}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                <span>Enviando...</span>
                            </>
                        ) : (
                            <>
                                <span>📤</span>
                                <span>Salvar Foto</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        );
    }
);

ProfileAvatarUploader.displayName = 'ProfileAvatarUploader';
