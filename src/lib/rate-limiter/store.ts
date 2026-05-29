
export interface RequestRecord {
    count: number;
    resetTime: number;
}

// Armazenamento em memória (para cliente)
export const requestStore = new Map<string, RequestRecord>();
