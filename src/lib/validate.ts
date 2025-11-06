/**
 * Funções de validação de entrada para prevenir ataques
 * e garantir integridade dos dados
 */

/**
 * Valida e sanitiza payload de filtros para funções RPC
 */
export function validateFilterPayload(payload: any): any {
  const validated: any = {};

  // Validar ano
  if (payload.p_ano !== undefined && payload.p_ano !== null) {
    const ano = parseInt(String(payload.p_ano), 10);
    if (isNaN(ano) || ano < 2000 || ano > 2100) {
      throw new Error('Ano inválido. Deve estar entre 2000 e 2100.');
    }
    validated.p_ano = ano;
  }

  // Validar semana
  if (payload.p_semana !== undefined && payload.p_semana !== null) {
    const semana = parseInt(String(payload.p_semana), 10);
    if (isNaN(semana) || semana < 1 || semana > 53) {
      throw new Error('Semana inválida. Deve estar entre 1 e 53.');
    }
    validated.p_semana = semana;
  }

  // Validar praça
  if (payload.p_praca) {
    const praca = String(payload.p_praca).trim();
    if (praca.length === 0 || praca.length > 100) {
      throw new Error('Praça inválida. Deve ter entre 1 e 100 caracteres.');
    }
    // Permitir apenas letras, números, espaços, hífen e underscore
    if (!/^[a-zA-Z0-9\s\-_áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]+$/.test(praca)) {
      throw new Error('Praça contém caracteres inválidos.');
    }
    validated.p_praca = praca;
  }

  // Validar sub-praças (array ou string separada por vírgula)
  if (payload.p_sub_praca) {
    let subPracas: string[];
    
    if (Array.isArray(payload.p_sub_praca)) {
      subPracas = payload.p_sub_praca;
    } else if (typeof payload.p_sub_praca === 'string') {
      subPracas = payload.p_sub_praca.split(',').map(s => s.trim()).filter(s => s.length > 0);
    } else {
      throw new Error('Sub-praças deve ser um array ou string separada por vírgula.');
    }

    // Limitar quantidade e tamanho
    if (subPracas.length > 50) {
      throw new Error('Máximo de 50 sub-praças permitidas.');
    }

    subPracas = subPracas
      .slice(0, 50)
      .map((s: string) => {
        const trimmed = s.trim();
        if (trimmed.length === 0 || trimmed.length > 100) {
          throw new Error('Cada sub-praça deve ter entre 1 e 100 caracteres.');
        }
        if (!/^[a-zA-Z0-9\s\-_áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]+$/.test(trimmed)) {
          throw new Error('Sub-praça contém caracteres inválidos.');
        }
        return trimmed;
      });

    validated.p_sub_praca = subPracas.join(',');
  }

  // Validar origens (mesma lógica de sub-praças)
  if (payload.p_origem) {
    let origens: string[];
    
    if (Array.isArray(payload.p_origem)) {
      origens = payload.p_origem;
    } else if (typeof payload.p_origem === 'string') {
      origens = payload.p_origem.split(',').map(s => s.trim()).filter(s => s.length > 0);
    } else {
      throw new Error('Origens deve ser um array ou string separada por vírgula.');
    }

    if (origens.length > 50) {
      throw new Error('Máximo de 50 origens permitidas.');
    }

    origens = origens
      .slice(0, 50)
      .map((s: string) => {
        const trimmed = s.trim();
        if (trimmed.length === 0 || trimmed.length > 100) {
          throw new Error('Cada origem deve ter entre 1 e 100 caracteres.');
        }
        if (!/^[a-zA-Z0-9\s\-_áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]+$/.test(trimmed)) {
          throw new Error('Origem contém caracteres inválidos.');
        }
        return trimmed;
      });

    validated.p_origem = origens.join(',');
  }

  // Validar turnos (mesma lógica)
  if (payload.p_turno) {
    let turnos: string[];
    
    if (Array.isArray(payload.p_turno)) {
      turnos = payload.p_turno;
    } else if (typeof payload.p_turno === 'string') {
      turnos = payload.p_turno.split(',').map(s => s.trim()).filter(s => s.length > 0);
    } else {
      throw new Error('Turnos deve ser um array ou string separada por vírgula.');
    }

    if (turnos.length > 50) {
      throw new Error('Máximo de 50 turnos permitidos.');
    }

    turnos = turnos
      .slice(0, 50)
      .map((s: string) => {
        const trimmed = s.trim();
        if (trimmed.length === 0 || trimmed.length > 100) {
          throw new Error('Cada turno deve ter entre 1 e 100 caracteres.');
        }
        if (!/^[a-zA-Z0-9\s\-_áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]+$/.test(trimmed)) {
          throw new Error('Turno contém caracteres inválidos.');
        }
        return trimmed;
      });

    validated.p_turno = turnos.join(',');
  }

  // Validar limite (para queries que aceitam)
  if (payload.p_limite_semanas !== undefined && payload.p_limite_semanas !== null) {
    const limite = parseInt(String(payload.p_limite_semanas), 10);
    if (isNaN(limite) || limite < 1 || limite > 100) {
      throw new Error('Limite inválido. Deve estar entre 1 e 100.');
    }
    validated.p_limite_semanas = limite;
  }

  return validated;
}

/**
 * Valida se um valor é um número inteiro válido dentro de um range
 */
export function validateInteger(
  value: any,
  min: number,
  max: number,
  fieldName: string = 'Valor'
): number {
  const num = parseInt(String(value), 10);
  if (isNaN(num)) {
    throw new Error(`${fieldName} deve ser um número.`);
  }
  if (num < min || num > max) {
    throw new Error(`${fieldName} deve estar entre ${min} e ${max}.`);
  }
  return num;
}

/**
 * Valida e sanitiza string
 */
export function validateString(
  value: any,
  maxLength: number = 1000,
  fieldName: string = 'Campo',
  allowEmpty: boolean = false
): string {
  if (value === null || value === undefined) {
    if (allowEmpty) return '';
    throw new Error(`${fieldName} é obrigatório.`);
  }

  const str = String(value).trim();
  
  if (!allowEmpty && str.length === 0) {
    throw new Error(`${fieldName} não pode estar vazio.`);
  }

  if (str.length > maxLength) {
    throw new Error(`${fieldName} não pode ter mais de ${maxLength} caracteres.`);
  }

  return str;
}

