import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  auditFiles,
  generateAuditReport,
  hasConsentVariable,
  isEnvFile,
  scanEnvFileContent,
  scanFileContent,
} from '../skills/ads-conversion-tracking/scripts/audit-tracking-config.js';

const EXAMPLE_FILES = [
  'examples/nextjs-posthog/.env.example',
  'examples/nextjs-posthog/lib/posthog-client.ts',
  'examples/nextjs-posthog/lib/track-signup-completed.ts',
  'examples/nextjs-posthog/lib/subscription-started-ad-conversion.ts',
];

test('détecte un identifiant de conversion Google Ads codé en dur', () => {
  const findings = scanFileContent('lib/ads.ts', 'const conversionId = "AW-123456789";');
  assert.ok(findings.some((finding) => finding.ruleId === 'google-ads-conversion-id'));
});

test("détecte un jeton d'accès Meta codé en dur", () => {
  const findings = scanFileContent(
    'lib/ads.ts',
    'const token = "EAABwzLixnjYBAabcdefghijklmnopqrstuv";',
  );
  assert.ok(findings.some((finding) => finding.ruleId === 'meta-access-token'));
});

test('détecte une assignation de secret générique hors process.env', () => {
  const findings = scanFileContent(
    'lib/ads.ts',
    'const apiSecretKey = "abcdefghijklmnopqrstuvwxyz123456";',
  );
  assert.ok(findings.some((finding) => finding.ruleId === 'generic-secret-assignment'));
});

test('ne signale rien pour une lecture via process.env', () => {
  const findings = scanFileContent(
    'lib/ads.ts',
    'const apiSecretKey = process.env.META_ACCESS_TOKEN;',
  );
  assert.deepEqual(findings, []);
});

test('détecte un email en clair dans le code (hors domaine placeholder)', () => {
  const findings = scanFileContent('lib/ads.ts', 'const contact = "support@ma-societe.com";');
  assert.ok(findings.some((finding) => finding.ruleId === 'raw-email-in-source'));
});

test('ignore un email avec un domaine placeholder', () => {
  const findings = scanFileContent('lib/ads.ts', 'const contact = "user@example.com";');
  assert.deepEqual(findings, []);
});

test('ne révèle jamais la valeur détectée dans le contexte du finding', () => {
  const findings = scanFileContent(
    'lib/ads.ts',
    'const token = "EAABwzLixnjYBAabcdefghijklmnopqrstuv";',
  );
  const finding = findings.find((item) => item.ruleId === 'meta-access-token');
  assert.ok(finding);
  assert.ok(!finding?.context.includes('EAABwzLixnjYBAabcdefghijklmnopqrstuv'));
  assert.ok(finding?.context.includes('[REDACTED]'));
});

test('reconnaît un fichier .env(.example|.local) via isEnvFile', () => {
  assert.equal(isEnvFile('.env.example'), true);
  assert.equal(isEnvFile('.env.local'), true);
  assert.equal(isEnvFile('examples/nextjs-posthog/.env.example'), true);
  assert.equal(isEnvFile('lib/config.ts'), false);
});

test('ignore une variable .env sensible laissée vide', () => {
  const findings = scanEnvFileContent('.env.example', 'META_ACCESS_TOKEN=\n');
  assert.deepEqual(findings, []);
});

test('ignore une variable .env sensible avec une valeur placeholder', () => {
  const findings = scanEnvFileContent(
    '.env.example',
    'GOOGLE_ADS_CONVERSION_ID=your-conversion-id\n',
  );
  assert.deepEqual(findings, []);
});

test('signale une variable .env sensible avec une valeur littérale', () => {
  const findings = scanEnvFileContent('.env.example', 'GOOGLE_ADS_CONVERSION_ID=AW-987654321\n');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].context, 'GOOGLE_ADS_CONVERSION_ID=[REDACTED]');
});

test('classe une clé TOKEN/SECRET en sévérité haute et une clé _ID en sévérité moyenne', () => {
  const tokenFindings = scanEnvFileContent('.env.example', 'META_ACCESS_TOKEN=abcdefghijklmnop\n');
  const idFindings = scanEnvFileContent('.env.example', 'GOOGLE_ADS_CONVERSION_ID=AW-987654321\n');

  assert.equal(tokenFindings[0].severity, 'high');
  assert.equal(idFindings[0].severity, 'medium');
});

test('ignore une clé .env non sensible', () => {
  const findings = scanEnvFileContent('.env.example', 'NEXT_PUBLIC_APP_NAME=mon-saas\n');
  assert.deepEqual(findings, []);
});

test("détecte la présence d'une variable de consentement", () => {
  const files = [{ path: '.env.example', content: 'NEXT_PUBLIC_ADS_CONSENT_COOKIE_NAME=\n' }];
  assert.equal(hasConsentVariable(files), true);
});

test("signale l'absence de variable de consentement", () => {
  const files = [{ path: '.env.example', content: 'NEXT_PUBLIC_APP_NAME=mon-saas\n' }];
  assert.equal(hasConsentVariable(files), false);
});

test('auditFiles combine le scan de code, le scan .env et le contrôle de consentement', () => {
  const files = [
    {
      path: '.env.example',
      content: 'GOOGLE_ADS_CONVERSION_ID=AW-987654321\nCONSENT_COOKIE_NAME=\n',
    },
    { path: 'lib/ads.ts', content: 'const token = process.env.META_ACCESS_TOKEN;' },
  ];

  const report = auditFiles(files);

  assert.equal(report.hasConsentVariable, true);
  // La même ligne .env déclenche deux règles complémentaires : la règle générique
  // (google-ads-conversion-id, appliquée à tout fichier) et la règle spécifique aux
  // fichiers .env (clé sensible avec valeur littérale). C'est le comportement voulu.
  assert.equal(report.findings.length, 2);
  assert.ok(report.findings.some((finding) => finding.ruleId === 'google-ads-conversion-id'));
  assert.ok(
    report.findings.some((finding) => finding.ruleId === 'env-sensitive-key-with-literal-value'),
  );
});

test('le rapport Markdown ne contient aucune valeur détectée et signale le résumé', () => {
  const files = [
    { path: '.env.example', content: 'GOOGLE_ADS_CONVERSION_ID=AW-987654321\n' },
    { path: 'lib/ads.ts', content: 'const token = "EAABwzLixnjYBAabcdefghijklmnopqrstuv";' },
  ];

  const report = auditFiles(files);
  const markdown = generateAuditReport(report);

  assert.ok(!markdown.includes('AW-987654321'));
  assert.ok(!markdown.includes('EAABwzLixnjYBAabcdefghijklmnopqrstuv'));
  assert.ok(markdown.includes('Aucune variable de consentement détectée'));
  assert.ok(markdown.includes('constat(s) au total'));
});

test('le rapport indique "Aucune valeur suspecte détectée" quand tout est propre', () => {
  const report = auditFiles([{ path: 'lib/ads.ts', content: 'const token = process.env.TOKEN;' }]);
  const markdown = generateAuditReport(report);

  assert.ok(markdown.includes('Aucune valeur suspecte détectée.'));
});

test("l'exemple nextjs-posthog du dépôt ne déclenche aucun constat de sévérité haute et documente le consentement", () => {
  const files = EXAMPLE_FILES.map((path) => ({ path, content: readFileSync(path, 'utf8') }));
  const report = auditFiles(files);

  assert.equal(report.hasConsentVariable, true);
  assert.deepEqual(
    report.findings.filter((finding) => finding.severity === 'high'),
    [],
  );
});
