export const formatarReal = (valor: number | null | undefined) => {
    if (valor == null || isNaN(valor)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
};
