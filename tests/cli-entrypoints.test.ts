import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

/**
 * Tests de non-régression pour le garde d'entrée CLI (`if (fileURLToPath(import.meta.url) ===
 * resolve(process.argv[1])) { main(); }`). Un ancien garde basé sur une comparaison de chaîne
 * (`import.meta.url === \`file://${process.argv[1]}\``) échouait silencieusement sous Windows
 * (chemins avec antislash) : le script se terminait avec le code 0 sans jamais exécuter main() ni
 * produire de sortie. Ces tests exécutent chaque CLI compilé dans un vrai sous-processus pour
 * s'assurer que main() s'exécute réellement quel que soit l'OS.
 */

function runCli(
  scriptPath: string,
  args: string[],
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [scriptPath, ...args], { encoding: 'utf8' });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

test('validate-event-name.js produit une sortie et un exit code 0 pour un nom valide', () => {
  const result = runCli('dist/skills/saas-event-instrumentation/scripts/validate-event-name.js', [
    'signup_completed',
  ]);
  assert.equal(result.status, 0);
  assert.ok(result.stdout.includes('OK'));
});

test("validate-event-name.js exit 1 avec un message d'usage sans argument", () => {
  const result = runCli(
    'dist/skills/saas-event-instrumentation/scripts/validate-event-name.js',
    [],
  );
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('Usage'));
});

test('validate-event-catalog.js produit un rapport pour le catalogue modèle', () => {
  const result = runCli(
    'dist/skills/saas-event-instrumentation/scripts/validate-event-catalog.js',
    ['skills/saas-event-instrumentation/templates/event-catalog.yml'],
  );
  assert.equal(result.status, 0);
  assert.ok(result.stdout.includes('OK'));
});

test('analyze-funnel.js produit un rapport Markdown pour la fixture', () => {
  const result = runCli('dist/skills/saas-funnel-diagnosis/scripts/analyze-funnel.js', [
    'tests/fixtures/funnel-metrics-sample.csv',
  ]);
  assert.equal(result.status, 0);
  assert.ok(result.stdout.includes("# Rapport d'analyse de funnel"));
});

test("analyze-funnel.js exit 1 avec un message d'usage sans argument", () => {
  const result = runCli('dist/skills/saas-funnel-diagnosis/scripts/analyze-funnel.js', []);
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes('Usage'));
});

test('audit-tracking-config.js produit un rapport pour un répertoire existant', () => {
  const result = runCli('dist/skills/ads-conversion-tracking/scripts/audit-tracking-config.js', [
    'examples/nextjs-posthog',
  ]);
  assert.equal(result.status, 0);
  assert.ok(result.stdout.includes("# Rapport d'audit"));
});

test('audit-tracking-config.js exit 1 pour un répertoire inexistant', () => {
  const result = runCli('dist/skills/ads-conversion-tracking/scripts/audit-tracking-config.js', [
    'chemin/qui/n-existe-pas',
  ]);
  assert.equal(result.status, 1);
  assert.ok(result.stdout.includes('ERREUR'));
});
