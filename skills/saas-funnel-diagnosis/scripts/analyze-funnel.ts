/**
 * CLI d'analyse de funnel à partir d'un export CSV agrégé (étape, utilisateurs, période).
 * Lecture seule, aucun appel réseau, ne dépend d'aucun SDK analytics (pas de PostHog).
 *
 * Calcule les taux de conversion/abandon étape à étape et produit un rapport Markdown
 * déterministe (mêmes données en entrée, même rapport en sortie). Ce script ne formule
 * jamais d'hypothèse causale ni de recommandation : cela reste la responsabilité de
 * l'étape d'analyse produit décrite dans SKILL.md, à partir de ce rapport.
 *
 * Usage : node analyze-funnel.ts <export.csv>
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computeFunnelDropoff,
  findWorstDropoffStep,
  type FunnelStepResult,
} from './funnel-dropoff.js';

export interface FunnelCsvRow {
  step: string;
  users: number;
  period: string;
}

export interface ParseResult {
  rows: FunnelCsvRow[];
  errors: string[];
}

const REQUIRED_COLUMNS = ['step', 'users', 'period'] as const;

const COLUMN_ALIASES: Record<string, (typeof REQUIRED_COLUMNS)[number]> = {
  etape: 'step',
  step: 'step',
  utilisateurs: 'users',
  users: 'users',
  periode: 'period',
  period: 'period',
};

const COMBINING_DIACRITICAL_MARKS = /[̀-ͯ]/g;

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(COMBINING_DIACRITICAL_MARKS, '');
}

function normalizeHeaderName(value: string): string {
  return stripDiacritics(value.trim().toLowerCase());
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

export function parseFunnelCsv(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { rows: [], errors: ['Fichier CSV vide.'] };
  }

  const headerFields = parseCsvLine(lines[0]).map(normalizeHeaderName);
  const columnIndex: Partial<Record<(typeof REQUIRED_COLUMNS)[number], number>> = {};

  headerFields.forEach((field, index) => {
    const canonical = COLUMN_ALIASES[field];
    if (canonical) {
      columnIndex[canonical] = index;
    }
  });

  const missingColumns = REQUIRED_COLUMNS.filter((column) => columnIndex[column] === undefined);
  if (missingColumns.length > 0) {
    return {
      rows: [],
      errors: [
        `Colonnes manquantes dans l'en-tête : ${missingColumns.join(', ')}. Colonnes attendues : ` +
          'etape (ou step), utilisateurs (ou users), periode (ou period).',
      ],
    };
  }

  const stepIndex = columnIndex.step as number;
  const usersIndex = columnIndex.users as number;
  const periodIndex = columnIndex.period as number;

  const rows: FunnelCsvRow[] = [];
  const errors: string[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const fields = parseCsvLine(lines[lineIndex]);
    const rowNumber = lineIndex + 1;

    const step = fields[stepIndex]?.trim();
    const usersRaw = fields[usersIndex]?.trim();
    const period = fields[periodIndex]?.trim();

    if (!step) {
      errors.push(`Ligne ${rowNumber} : "etape" manquante — ligne ignorée.`);
      continue;
    }

    if (!period) {
      errors.push(`Ligne ${rowNumber} : "periode" manquante — ligne ignorée.`);
      continue;
    }

    if (usersRaw === undefined || usersRaw === '' || !/^\d+$/.test(usersRaw)) {
      errors.push(
        `Ligne ${rowNumber} : "utilisateurs" invalide ("${usersRaw ?? ''}") — doit être un ` +
          'entier positif ou nul. Ligne ignorée.',
      );
      continue;
    }

    rows.push({ step, users: Number.parseInt(usersRaw, 10), period });
  }

  return { rows, errors };
}

export interface ValidationIssue {
  message: string;
}

function groupRowsByPeriod(rows: FunnelCsvRow[]): Map<string, FunnelCsvRow[]> {
  const groups = new Map<string, FunnelCsvRow[]>();
  for (const row of rows) {
    const group = groups.get(row.period);
    if (group) {
      group.push(row);
    } else {
      groups.set(row.period, [row]);
    }
  }
  return groups;
}

export function validateFunnelRows(rows: FunnelCsvRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const key = `${row.period}::${row.step}`;
    if (seen.has(key)) {
      issues.push({
        message: `Doublon détecté : l'étape "${row.step}" apparaît plusieurs fois pour la période "${row.period}".`,
      });
    }
    seen.add(key);
  }

  const byPeriod = groupRowsByPeriod(rows);
  for (const [period, periodRows] of byPeriod) {
    for (let i = 1; i < periodRows.length; i += 1) {
      const previous = periodRows[i - 1];
      const current = periodRows[i];
      if (previous.users > 0 && current.users > previous.users) {
        issues.push({
          message:
            `Valeur incohérente pour la période "${period}" : "${current.step}" (${current.users}) a ` +
            `plus d'utilisateurs que l'étape précédente "${previous.step}" (${previous.users}). ` +
            "Un funnel ne peut pas croître d'une étape à l'autre.",
        });
      }
    }
  }

  return issues;
}

export interface FunnelAnalysis {
  period: string;
  steps: FunnelStepResult[];
  bottleneck: FunnelStepResult | null;
}

export function buildFunnelAnalysis(rows: FunnelCsvRow[]): FunnelAnalysis | null {
  if (rows.length === 0) {
    return null;
  }

  const byPeriod = groupRowsByPeriod(rows);
  const periods = [...byPeriod.keys()];
  const currentPeriod = periods[periods.length - 1];
  const periodRows = byPeriod.get(currentPeriod) ?? [];

  const steps = computeFunnelDropoff(
    periodRows.map((row) => ({ name: row.step, count: row.users })),
  );
  const bottleneck = findWorstDropoffStep(steps);

  return { period: currentPeriod, steps, bottleneck };
}

const MIN_RELIABLE_SAMPLE_SIZE = 30;

function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)} %`;
}

export function generateFunnelMarkdownReport(
  analysis: FunnelAnalysis | null,
  parseErrors: string[],
  validationIssues: ValidationIssue[],
): string {
  const lines: string[] = [];

  lines.push("# Rapport d'analyse de funnel");
  lines.push('');
  lines.push(
    "Ce rapport est généré automatiquement à partir d'un export agrégé. Il décrit des " +
      'corrélations observées dans les données fournies — il ne constitue en aucun cas une ' +
      "preuve de causalité et ne doit pas être utilisé seul pour décider d'une action.",
  );
  lines.push('');

  if (parseErrors.length > 0) {
    lines.push('## Erreurs de lecture');
    lines.push('');
    for (const error of parseErrors) {
      lines.push(`- ${error}`);
    }
    lines.push('');
  }

  if (!analysis) {
    lines.push('## Résumé exécutif');
    lines.push('');
    lines.push('Aucune donnée exploitable — le rapport ne peut pas être généré.');
    lines.push('');
    return lines.join('\n');
  }

  lines.push('## Résumé exécutif');
  lines.push('');
  lines.push(`- Période analysée : ${analysis.period}`);
  lines.push(`- Nombre d'étapes : ${analysis.steps.length}`);

  const first = analysis.steps[0];
  const last = analysis.steps[analysis.steps.length - 1];
  if (first && last && first.count > 0) {
    lines.push(
      `- Conversion globale (${first.name} → ${last.name}) : ` +
        `${formatPercent(last.count / first.count)} (${last.count}/${first.count})`,
    );
  }
  lines.push('');

  lines.push('## Tableau des étapes');
  lines.push('');
  lines.push("| Étape | Utilisateurs | Conversion depuis l'étape précédente | Abandon |");
  lines.push('| --- | --- | --- | --- |');
  for (const step of analysis.steps) {
    const conversion =
      step.conversionFromPrevious === null ? '—' : formatPercent(step.conversionFromPrevious);
    const dropoff =
      step.dropoffFromPrevious === null ? '—' : formatPercent(step.dropoffFromPrevious);
    lines.push(`| ${step.name} | ${step.count} | ${conversion} | ${dropoff} |`);
  }
  lines.push('');

  lines.push('## Goulot principal');
  lines.push('');
  if (analysis.bottleneck) {
    lines.push(
      `**${analysis.bottleneck.name}** — taux d'abandon de ` +
        `${formatPercent(analysis.bottleneck.dropoffFromPrevious ?? 0)} depuis l'étape précédente.`,
    );
  } else {
    lines.push('Aucun goulot ne peut être calculé (moins de deux étapes disponibles).');
  }
  lines.push('');

  if (validationIssues.length > 0) {
    lines.push('## Valeurs incohérentes détectées');
    lines.push('');
    for (const issue of validationIssues) {
      lines.push(`- ${issue.message}`);
    }
    lines.push('');
  }

  lines.push('## Limites statistiques');
  lines.push('');
  lines.push(
    "- Ce calcul est descriptif : une corrélation entre deux étapes ne prouve pas qu'une " +
      "cause précise explique l'abandon observé.",
  );
  const smallSampleSteps = analysis.steps.filter((step) => step.count < MIN_RELIABLE_SAMPLE_SIZE);
  if (smallSampleSteps.length > 0) {
    lines.push(
      `- Échantillon faible (< ${MIN_RELIABLE_SAMPLE_SIZE} utilisateurs) sur : ` +
        `${smallSampleSteps.map((step) => step.name).join(', ')}. Les taux correspondants sont ` +
        'peu fiables statistiquement.',
    );
  }
  lines.push(
    "- Les hypothèses causales, le plan d'expérimentation et la prochaine action recommandée " +
      "ne sont pas générés par ce script : ils relèvent de l'étape d'analyse produit décrite " +
      'dans SKILL.md, à partir de ce rapport.',
  );
  lines.push('');

  return lines.join('\n');
}

function main(): void {
  const filePath = process.argv[2];
  if (!filePath) {
    process.stderr.write('Usage: analyze-funnel.ts <export.csv>\n');
    process.exitCode = 1;
    return;
  }

  let content: string;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch (error) {
    process.stdout.write(
      `ERREUR: impossible de lire le fichier "${filePath}" — ${(error as Error).message}\n`,
    );
    process.exitCode = 1;
    return;
  }

  const { rows, errors: parseErrors } = parseFunnelCsv(content);

  if (rows.length === 0) {
    process.stdout.write(generateFunnelMarkdownReport(null, parseErrors, []));
    process.stdout.write('\n');
    process.exitCode = 1;
    return;
  }

  const validationIssues = validateFunnelRows(rows);
  const analysis = buildFunnelAnalysis(rows);

  process.stdout.write(generateFunnelMarkdownReport(analysis, parseErrors, validationIssues));
  process.stdout.write('\n');
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && fileURLToPath(import.meta.url) === resolve(invokedPath)) {
  main();
}
