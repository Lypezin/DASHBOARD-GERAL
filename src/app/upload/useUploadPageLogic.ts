import { useState, useEffect } from 'react';
import { useUploadAuth } from '@/hooks/useUploadAuth';
import { useCorridasUpload } from '@/hooks/useCorridasUpload';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useGenericUploadState } from '@/hooks/upload/useGenericUploadState';
import { useOrganizationSelection } from '@/hooks/useOrganizationSelection';
import {
    MARKETING_COLUMN_MAP,
    VALORES_CIDADE_COLUMN_MAP,
} from '@/constants/upload';
import { marketingTransformers, valoresCidadeTransformers } from '@/utils/uploadTransformers';

export const useUploadPageLogic = () => {
    const { loading, isAuthorized, user } = useUploadAuth();
    const [showRetry, setShowRetry] = useState(false);

    // Generic State Hooks
    const marketingState = useGenericUploadState();
    const valoresCidadeState = useGenericUploadState();

    // Hook para seleção de organização
    const {
        organizations,
        selectedOrgId,
        setSelectedOrgId,
        isLoadingOrgs
    } = useOrganizationSelection(isAuthorized, user);

    // Mostrar botão de retry se o loading demorar muito
    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => {
                setShowRetry(true);
            }, 8000);

            return () => clearTimeout(timer);
        } else {
            setShowRetry(false);
        }
    }, [loading]);

    // Hook para upload de corridas
    const corridasUpload = useCorridasUpload({
        organizationId: selectedOrgId
    });

    // Hook genérico para upload de Marketing
    const marketingUpload = useFileUpload({
        tableName: 'dados_marketing',
        excelConfig: {
            columnMap: MARKETING_COLUMN_MAP,
            transformers: marketingTransformers,
            requiredFields: [],
            filterEmptyRows: true,
        },
        overwrite: true,
        deleteRpcFunction: 'delete_all_dados_marketing',
        refreshRpcFunction: 'refresh_mv_entregadores_marketing',
        organizationId: selectedOrgId
    });

    // Hook genérico para upload de Valores por Cidade
    const valoresCidadeUpload = useFileUpload({
        tableName: 'dados_valores_cidade',
        excelConfig: {
            columnMap: VALORES_CIDADE_COLUMN_MAP,
            transformers: valoresCidadeTransformers,
            requiredFields: ['data', 'id_atendente', 'cidade', 'valor'],
            filterEmptyRows: true,
        },
        overwrite: true,
        deleteRpcFunction: 'delete_all_dados_valores_cidade',
        organizationId: selectedOrgId
    });

    const handleMarketingUpload = async () => {
        await marketingUpload.uploadFiles(marketingState.files);
        if (!marketingUpload.uploading) {
            marketingState.clearFiles('marketing');
        }
    };

    const handleValoresCidadeUpload = async () => {
        await valoresCidadeUpload.uploadFiles(valoresCidadeState.files);
        if (!valoresCidadeUpload.uploading) {
            valoresCidadeState.clearFiles('valores-cidade');
        }
    };

    return {
        loading,
        isAuthorized,
        user,
        showRetry,
        organizations,
        selectedOrgId,
        setSelectedOrgId,
        isLoadingOrgs,
        marketingState,
        valoresCidadeState,
        corridasUpload,
        marketingUpload,
        valoresCidadeUpload,
        handleMarketingUpload,
        handleValoresCidadeUpload
    };
};
