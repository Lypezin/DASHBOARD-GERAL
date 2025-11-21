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

  // Validar data inicial
  if (payload.p_data_inicial !== undefined && payload.p_data_inicial !== null) {
    const dataInicial = String(payload.p_data_inicial).trim();
    if (dataInicial !== '') {
      // Validar formato YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dataInicial)) {
        throw new Error('Data inicial inválida. Use o formato YYYY-MM-DD.');
      }
      
      const data = new Date(dataInicial);
      if (isNaN(data.getTime())) {
        throw new Error('Data inicial inválida.');
      }
      
      // Validar range: não permitir datas futuras ou muito antigas
      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999); // Fim do dia de hoje
      const dataMinima = new Date('2020-01-01');
      
      if (data > hoje) {
        throw new Error('Data inicial não pode ser futura.');
      }
      
      if (data < dataMinima) {
        throw new Error('Data inicial não pode ser anterior a 2020-01-01.');
      }
      
      validated.p_data_inicial = dataInicial;
    }
  }

  // Validar data final
  if (payload.p_data_final !== undefined && payload.p_data_final !== null) {
    const dataFinal = String(payload.p_data_final).trim();
    if (dataFinal !== '') {
      // Validar formato YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dataFinal)) {
        throw new Error('Data final inválida. Use o formato YYYY-MM-DD.');
      }
      
      const data = new Date(dataFinal);
      if (isNaN(data.getTime())) {
        throw new Error('Data final inválida.');
      }
      
      // Validar range: não permitir datas futuras ou muito antigas
      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999); // Fim do dia de hoje
      const dataMinima = new Date('2020-01-01');
      
      if (data > hoje) {
        throw new Error('Data final não pode ser futura.');
      }
      
      if (data < dataMinima) {
        throw new Error('Data final não pode ser anterior a 2020-01-01.');
      }
      
      // Validar que data final >= data inicial
      if (validated.p_data_inicial) {
        const dataIni = new Date(validated.p_data_inicial);
        if (data < dataIni) {
          throw new Error('Data final deve ser maior ou igual à data inicial.');
        }
      }
      
      validated.p_data_final = dataFinal;
    }
  }
  
  // Se apenas uma data foi fornecida, usar a mesma para ambas (filtrar 1 dia)
  if (validated.p_data_inicial && !validated.p_data_final) {
    validated.p_data_final = validated.p_data_inicial;
  }
  if (validated.p_data_final && !validated.p_data_inicial) {
    validated.p_data_inicial = validated.p_data_final;
  }

  // Validar praça (pode ser string única ou múltiplas separadas por vírgula)
  if (payload.p_praca) {
    let pracas: string[];
    
    if (Array.isArray(payload.p_praca)) {
      pracas = payload.p_praca;
    } else if (typeof payload.p_praca === 'string') {
      // Se contém vírgula, tratar como múltiplas praças
      if (payload.p_praca.includes(',')) {
        pracas = payload.p_praca.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      } else {
        pracas = [payload.p_praca.trim()];
      }
    } else {
      throw new Error('Praça deve ser uma string ou array.');
    }

    // Limitar quantidade e tamanho
    if (pracas.length > 50) {
      throw new Error('Máximo de 50 praças permitidas.');
    }

    pracas = pracas
      .slice(0, 50)
      .map((s: string) => {
        const trimmed = s.trim();
        if (trimmed.length === 0 || trimmed.length > 100) {
          throw new Error('Cada praça deve ter entre 1 e 100 caracteres.');
        }
        if (!/^[a-zA-Z0-9\s\-_áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]+$/.test(trimmed)) {
          throw new Error('Praça contém caracteres inválidos.');
        }
        return trimmed;
      });

    validated.p_praca = pracas.length === 1 ? pracas[0] : pracas.join(',');
  }

  // Validar sub-praças (array ou string separada por vírgula)
  if (payload.p_sub_praca) {
    let subPracas: string[];
    
    if (Array.isArray(payload.p_sub_praca)) {
      subPracas = payload.p_sub_praca;
    } else if (typeof payload.p_sub_praca === 'string') {
      subPracas = payload.p_sub_praca.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
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
      origens = payload.p_origem.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
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
      turnos = payload.p_turno.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
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

