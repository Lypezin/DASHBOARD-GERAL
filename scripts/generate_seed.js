const XLSX = require('xlsx');

const wb = XLSX.utils.book_new();
const data = [];
const start = new Date(2025, 7, 25);
const dias = ['MANHÃ', 'ALMOÇO', 'TARDE', 'JANTAR', 'J5', 'MADRUGADA'];
const pracas = ['MANAUS'];
const subPracas = ['MANAUS - CENTRO', 'MANAUS - CIDADE NOVA', 'MANAUS - PONTA NEGRA'];
let idx = 0;

for (let d = 0; d < 21; d++) {
  const dataPeriodo = new Date(start.getTime() + d * 86400000);
  for (const periodo of dias) {
    for (const praca of pracas) {
      for (const sub of subPracas) {
        const escala = Math.floor(1 + Math.random() * 5);
        const duracaoHoras = 4;
        const duracao = duracaoHoras / 24; // Excel fraction
        const tempoDisponivel = ((Math.random() * 0.8) + 0.2) * duracao;

        data.push({
          data_do_periodo: dataPeriodo.toISOString().split('T')[0],
          periodo,
          duracao_do_periodo: duracao,
          numero_minimo_de_entregadores_regulares_na_escala: escala,
          tag: 'REGULAR',
          id_da_pessoa_entregadora: `${idx}`,
          pessoa_entregadora: `Entregador ${idx}`,
          praca,
          sub_praca: sub,
          origem: 'APP',
          tempo_disponivel_escalado: Math.round(tempoDisponivel * 86400),
          tempo_disponivel_absoluto: tempoDisponivel,
          numero_de_corridas_ofertadas: Math.floor(Math.random() * 10),
          numero_de_corridas_aceitas: Math.floor(Math.random() * 8),
          numero_de_corridas_rejeitadas: Math.floor(Math.random() * 4),
          numero_de_corridas_completadas: Math.floor(Math.random() * 7),
          numero_de_corridas_canceladas_pela_pessoa_entregadora: Math.floor(Math.random() * 2),
          numero_de_pedidos_aceitos_e_concluidos: Math.floor(Math.random() * 7),
          soma_das_taxas_das_corridas_aceitas: Math.round(Math.random() * 200) / 10,
        });
        idx++;
      }
    }
  }
}

const worksheet = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, worksheet, 'Dados');
XLSX.writeFile(wb, 'seed_dashboard.xlsx');
