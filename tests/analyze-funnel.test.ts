import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  buildFunnelAnalysis,
  generateFunnelMarkdownReport,
  parseFunnelCsv,
  validateFunnelRows,
} from '../skills/saas-funnel-diagnosis/scripts/analyze-funnel.js';

const FIXTURE_PATH = 'tests/fixtures/funnel-metrics-sample.csv';

test('parse la fixture CSV anonymisée sans erreur', () => {
  const content = readFileSync(FIXTURE_PATH, 'utf8');
  const { rows, errors } = parseFunnelCsv(content);

  assert.deepEqual(errors, []);
  assert.equal(rows.length, 4);
  assert.deepEqual(rows[0], { step: 'signup_completed', users: 1000, period: '2026-06' });
});

test('calcule le funnel et identifie le goulot principal sur la fixture', () => {
  const content = readFileSync(FIXTURE_PATH, 'utf8');
  const { rows } = parseFunnelCsv(content);
  const analysis = buildFunnelAnalysis(rows);

  assert.ok(analysis);
  assert.equal(analysis?.period, '2026-06');
  assert.equal(analysis?.steps.length, 4);
  assert.equal(analysis?.bottleneck?.name, 'checkout_started');
});

test("accepte l'en-tête anglais step,users,period", () => {
  const content = [
    'step,users,period',
    'signup_completed,500,2026-06',
    'checkout_started,200,2026-06',
  ].join('\n');
  const { rows, errors } = parseFunnelCsv(content);

  assert.deepEqual(errors, []);
  assert.equal(rows.length, 2);
});

test("signale les colonnes manquantes dans l'en-tête", () => {
  const content = 'etape,periode\nsignup_completed,2026-06';
  const { rows, errors } = parseFunnelCsv(content);

  assert.equal(rows.length, 0);
  assert.ok(errors[0]?.includes('Colonnes manquantes'));
});

test("ignore une ligne avec un nombre d'utilisateurs invalide", () => {
  const content = [
    'etape,utilisateurs,periode',
    'signup_completed,abc,2026-06',
    'checkout_started,100,2026-06',
  ].join('\n');
  const { rows, errors } = parseFunnelCsv(content);

  assert.equal(rows.length, 1);
  assert.ok(errors[0]?.includes('invalide'));
});

test("détecte un funnel qui croît d'une étape à l'autre (valeur incohérente)", () => {
  const rows = [
    { step: 'signup_completed', users: 100, period: '2026-06' },
    { step: 'checkout_started', users: 150, period: '2026-06' },
  ];
  const issues = validateFunnelRows(rows);

  assert.equal(issues.length, 1);
  assert.ok(issues[0].message.includes('incohérente'));
});

test('détecte un doublon étape/période', () => {
  const rows = [
    { step: 'signup_completed', users: 100, period: '2026-06' },
    { step: 'signup_completed', users: 90, period: '2026-06' },
  ];
  const issues = validateFunnelRows(rows);

  assert.ok(issues.some((issue) => issue.message.includes('Doublon')));
});

test('sélectionne la période la plus récente (dernière du fichier) en cas de multi-périodes', () => {
  const content = [
    'etape,utilisateurs,periode',
    'signup_completed,100,2026-05',
    'checkout_started,40,2026-05',
    'signup_completed,200,2026-06',
    'checkout_started,90,2026-06',
  ].join('\n');
  const { rows } = parseFunnelCsv(content);
  const analysis = buildFunnelAnalysis(rows);

  assert.equal(analysis?.period, '2026-06');
  assert.equal(analysis?.steps[0]?.count, 200);
});

test('retourne null quand aucune ligne exploitable', () => {
  assert.equal(buildFunnelAnalysis([]), null);
});

test('le rapport Markdown est déterministe pour les mêmes données', () => {
  const rows = [
    { step: 'signup_completed', users: 100, period: '2026-06' },
    { step: 'checkout_started', users: 40, period: '2026-06' },
  ];
  const analysis = buildFunnelAnalysis(rows);
  const reportA = generateFunnelMarkdownReport(analysis, [], []);
  const reportB = generateFunnelMarkdownReport(analysis, [], []);

  assert.equal(reportA, reportB);
  assert.ok(reportA.includes("# Rapport d'analyse de funnel"));
  assert.ok(reportA.includes('## Goulot principal'));
});

test('le rapport signale explicitement les limites statistiques sur petits échantillons', () => {
  const rows = [
    { step: 'signup_completed', users: 20, period: '2026-06' },
    { step: 'checkout_started', users: 5, period: '2026-06' },
  ];
  const analysis = buildFunnelAnalysis(rows);
  const report = generateFunnelMarkdownReport(analysis, [], []);

  assert.ok(report.includes('Échantillon faible'));
  assert.ok(report.includes('ne prouve pas'));
});

test('le rapport signale les erreurs de parsing et les incohérences détectées', () => {
  const rows = [
    { step: 'signup_completed', users: 100, period: '2026-06' },
    { step: 'checkout_started', users: 150, period: '2026-06' },
  ];
  const issues = validateFunnelRows(rows);
  const analysis = buildFunnelAnalysis(rows);
  const report = generateFunnelMarkdownReport(analysis, ['Ligne 3 : erreur de test.'], issues);

  assert.ok(report.includes('## Erreurs de lecture'));
  assert.ok(report.includes('## Valeurs incohérentes détectées'));
});

test('le rapport ne génère pas de résumé exploitable sans analyse', () => {
  const report = generateFunnelMarkdownReport(null, ['Fichier CSV vide.'], []);

  assert.ok(report.includes('Aucune donnée exploitable'));
});
