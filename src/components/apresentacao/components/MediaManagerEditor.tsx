import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { MediaSlideData } from '@/types/presentation';
import { useMediaEditor } from './MediaEditor/useMediaEditor';
import { EditorCanvas } from './MediaEditor/EditorCanvas';
import { EditorToolbar } from './MediaEditor/EditorToolbar';
import { PropertiesPanel } from './MediaEditor/PropertiesPanel';

interface MediaManagerEditorProps {
    selectedSlide: MediaSlideData | undefined;
    onUpdate: (updates: Partial<MediaSlideData>) => void;
}

export const MediaManagerEditor: React.FC<MediaManagerEditorProps> = ({
    selectedSlide,
    onUpdate
}) => {
    const {
        selectedElementId,
        setSelectedElementId,
        fileInputRef,
        elements,
        activeElement,
        handleUpdateElement,
        handleAddText,
        handleAddImage,
        handleDeleteElement
    } = useMediaEditor(selectedSlide, onUpdate);

    if (!selectedSlide) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Selecione ou adicione um slide para editar</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-6">
            <EditorCanvas
                elements={elements}
                selectedElementId={selectedElementId}
                setSelectedElementId={setSelectedElementId}
                handleUpdateElement={handleUpdateElement}
            />

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 shrink-0">
                <EditorToolbar
                    fileInputRef={fileInputRef}
                    handleAddImage={handleAddImage}
                    handleAddText={handleAddText}
                    activeElement={activeElement}
                    handleDeleteElement={handleDeleteElement}
                />

                <PropertiesPanel
                    activeElement={activeElement}
                    handleUpdateElement={handleUpdateElement}
                />
            </div>
        </div>
    );
};
