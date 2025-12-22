import React from 'react';
import Image from 'next/image';

interface ProfileAvatarDisplayProps {
    displayUrl: string | null | undefined;
    onRemove: () => void;
    canRemove: boolean;
    uploading: boolean;
}

export const ProfileAvatarDisplay: React.FC<ProfileAvatarDisplayProps> = ({
    displayUrl,
    onRemove,
    canRemove,
    uploading
}) => {
    return (
        <div className="flex-shrink-0">
            <div className="relative">
                <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg">
                    {displayUrl ? (
                        <Image
                            src={displayUrl}
                            alt="Foto de perfil"
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 128px, 160px"
                        />
                    ) : (
                        <span className="text-4xl sm:text-5xl text-white">👤</span>
                    )}
                </div>
                {canRemove && (
                    <button
                        onClick={onRemove}
                        disabled={uploading}
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remover foto"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};
