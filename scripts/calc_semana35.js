const XLSX = require('xlsx');
const path = process.argv[2] || 'tempo_semana35.xlsx';

const workbook = XLSX.readFile(path, { raw: true });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { raw: true });

const format = (seconds) => {
  const total = Math.round(seconds);
  const sign = total < 0 ? -1 : 1;
  let secs = Math.abs(total);
  const hours = Math.floor(secs / 3600);
  secs %= 3600;
  const minutes = Math.floor(secs / 60);
  const secondsFinal = secs % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${sign < 0 ? '-' : ''}${pad(hours)}:${pad(minutes)}:${pad(secondsFinal)}`;
};

let totalEntreguesSeconds = 0;
let totalAEntregarSeconds = 0;
const seen = new Set();

rows.forEach((row) => {
  const tempo = row['tempo_disponivel_absoluto'];
  if (typeof tempo === 'number') {
    totalEntreguesSeconds += tempo * 86400;
  }

  const escala = row['numero_minimo_de_entregadores_regulares_na_escala'];
  const duracao = row['duracao_do_periodo'];
  const key = [row['data_do_periodo'], row['periodo'], escala, duracao].join('||');

  if (!seen.has(key)) {
    seen.add(key);
    if (typeof escala === 'number' && typeof duracao === 'number') {
      totalAEntregarSeconds += escala * duracao * 86400;
    }
  }
});

console.log('Total linhas:', rows.length);
console.log('Horas Entregues (Excel):', format(totalEntreguesSeconds));
console.log('Horas a Entregar (Excel):', format(totalAEntregarSeconds));

