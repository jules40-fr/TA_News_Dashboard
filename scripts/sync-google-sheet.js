const fs = require('fs');
const path = require('path');

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1O0pyfF1Mjd9qSQ8EfOKbXCJJDCL70j-ysF9z72a-198';
const SHEET_GIDS = {
  KPIs: process.env.GOOGLE_SHEET_GID_KPIS || '270386200',
  Anniversaires: process.env.GOOGLE_SHEET_GID_ANNIVERSAIRES || '270386201',
  Opportunites: process.env.GOOGLE_SHEET_GID_OPPORTUNITES || '270386202',
  QHSE: process.env.GOOGLE_SHEET_GID_QHSE || '270386203'
};

function sheetUrl(gid) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=tsv&gid=${gid}`;
}

async function fetchSheet(name, gid) {
  const response = await fetch(sheetUrl(gid));
  if (!response.ok) {
    throw new Error(`Failed to fetch ${name}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function parseTsv(text) {
  return text
    .replace(/\r/g, '')
    .split('\n')
    .filter((line, index, arr) => !(index === arr.length - 1 && line === ''))
    .map((line) => line.split('\t'));
}

function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).trim().replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInt(value) {
  const parsed = toNumber(value);
  return parsed === null ? null : Math.round(parsed);
}

function parseKeyValueSheet(rows) {
  const values = {};
  for (let i = 1; i < rows.length; i += 1) {
    const [key, value] = rows[i];
    if (!key) break;
    values[key] = value ?? '';
  }
  return values;
}

function parseMonthlyRows(rows) {
  const start = rows.findIndex((row) => row[0] === 'mois');
  if (start === -1) {
    return { ca_n1_mensuel: [], ca_n_mensuel: [] };
  }

  const caN1 = [];
  const caN = [];
  for (let i = start + 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row[0]) continue;
    caN1.push(toNumber(row[1]));
    caN.push(row[2] === '' || row[2] === undefined ? null : toNumber(row[2]));
  }
  return { ca_n1_mensuel: caN1, ca_n_mensuel: caN };
}

function parseTable(rows) {
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => cell !== ''))
    .map((row) => {
      const item = {};
      headers.forEach((header, index) => {
        if (!header) return;
        item[header] = row[index] ?? '';
      });
      return item;
    });
}

function parseAnniversaires(rows) {
  return parseTable(rows).map((item) => ({
    initiales: item.initiales,
    nom: item.nom,
    role: item.role,
    client: item.client,
    date: item.date,
    age: toInt(item.age),
    color: item.color,
    colorbg: item.colorbg
  }));
}

function parseOpportunites(rows) {
  return parseTable(rows).map((item) => ({
    client: item.client,
    poste: item.poste,
    statut: item.statut,
    statut_label: item.statut_label,
    lieu: item.lieu,
    region: item.region,
    color: item.color
  }));
}

function parseQhse(rows) {
  const values = parseKeyValueSheet(rows);
  const headerIndex = rows.findIndex((row) => row[0] === 'sujet');
  const causeries = headerIndex === -1 ? [] : parseTable(rows.slice(headerIndex)).map((item) => ({
    sujet: item.sujet,
    animateur: item.animateur,
    date: item.date,
    color: item.color
  }));

  return {
    jours_sans_accident: toInt(values.jours_sans_accident),
    dernier_accident: values.dernier_accident || '',
    audits_realises: toInt(values.audits_realises),
    audits_a_faire: toInt(values.audits_a_faire),
    causeries
  };
}

function buildMetrics(kpiRows, anniversairesRows, opportunitesRows, qhseRows) {
  const values = parseKeyValueSheet(kpiRows);
  const monthly = parseMonthlyRows(kpiRows);

  return {
    ca_ytd: values.ca_ytd || '',
    ca_objectif: values.ca_objectif || '',
    ca_prog_pct: toNumber(values.ca_prog_pct),
    ca_trend_pct: values.ca_trend_pct || '',
    ca_trend_label: values.ca_trend_label || '',
    ca_n1_mensuel: monthly.ca_n1_mensuel,
    ca_n_mensuel: monthly.ca_n_mensuel,
    consultants: toInt(values.consultants),
    sourcing: toInt(values.sourcing),
    fins_de_mission: toInt(values.fins_de_mission),
    taux_occupation: values.taux_occupation || '',
    anniversaires: parseAnniversaires(anniversairesRows),
    opportunites: parseOpportunites(opportunitesRows),
    qhse: parseQhse(qhseRows)
  };
}

async function main() {
  const [kpisText, anniversairesText, opportunitesText, qhseText] = await Promise.all([
    fetchSheet('KPIs', SHEET_GIDS.KPIs),
    fetchSheet('Anniversaires', SHEET_GIDS.Anniversaires),
    fetchSheet('Opportunites', SHEET_GIDS.Opportunites),
    fetchSheet('QHSE', SHEET_GIDS.QHSE)
  ]);

  const metrics = buildMetrics(
    parseTsv(kpisText),
    parseTsv(anniversairesText),
    parseTsv(opportunitesText),
    parseTsv(qhseText)
  );

  const outputPath = path.join(process.cwd(), 'data', 'metrics.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  console.log(`metrics.json updated from Google Sheet ${SHEET_ID}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
