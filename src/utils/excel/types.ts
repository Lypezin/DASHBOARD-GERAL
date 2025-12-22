/**
 * Opções para transformação de colunas
 */
export interface ColumnTransformer {
    /** Nome da coluna no banco de dados */
    dbColumn: string;
    /** Função de transformação opcional */
    transform?: (value: unknown, rowIndex: number) => unknown;
    /** Se o campo é obrigatório */
    required?: boolean;
    /** Mensagem de erro customizada */
    errorMessage?: string;
}

/**
* Configuração para processamento de Excel
*/
export interface ExcelProcessConfig {
    /** Mapeamento de colunas Excel -> DB */
    columnMap: { [excelColumn: string]: string };
    /** Transformadores customizados por coluna */
    transformers?: { [dbColumn: string]: ColumnTransformer['transform'] };
    /** Campos obrigatórios */
    requiredFields?: string[];
    /** Se deve filtrar linhas vazias */
    filterEmptyRows?: boolean;
    /** Callback de progresso */
    onProgress?: (current: number, total: number) => void;
}
