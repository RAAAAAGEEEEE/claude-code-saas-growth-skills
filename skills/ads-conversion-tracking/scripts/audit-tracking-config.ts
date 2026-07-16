/**
 * Audite une configuration de tracking (.env.example, fichiers de config, code TypeScript)
 * pour repérer des valeurs qui ressemblent à des secrets ou des identifiants de tracking
 * codés en dur, et vérifie la présence d'une variable de consentement.
 *
 * Lecture seule : ne modifie aucun fichier, n'effectue aucun appel réseau. La sortie ne
 * révèle jamais la valeur des éléments détectés — uniquement leur emplacement et leur
 * nature probable. Détection heuristique par expressions régulières : des faux positifs et
 * faux négatifs sont possibles, ce rapport ne remplace pas une revue manuelle.
 *
 * Usage : node audit-tracking-config.ts <répertoire>
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type FindingSeverity = 'high' | 'medium';

export interface AuditFinding {
  file: string;
  line: number;
  ruleId: string;
  label: string;
  severity: FindingSeverity;
  context: string;
}

export interface SourceFile {
  path: string;
  content: string;
}

export interface AuditReport {
  findings: AuditFinding[];
  hasConsentVariable: boolean;
}

interface LiteralRule {
  id: string;
  label: string;
  severity: FindingSeverity;
  pattern: RegExp;
}

const PLACEHOLDER_VALUE_PATTERN =
  /^(your[-_ ]?.*|changeme|xxx+|placeholder|example|<.*>|\$\{.*\}|redacted)$/i;

const LITERAL_RULES: LiteralRule[] = [
  {
    id: 'google-ads-conversion-id',
    label: 'Identifiant de conversion Google Ads (AW-...) codé en dur',
    severity: 'high',
    pattern: /\bAW-\d{9,10}\b/,
  },
  {
    id: 'google-measurement-id',
    label: 'Identifiant de mesure Google Analytics (G-...) codé en dur',
    severity: 'medium',
    pattern: /\bG-[A-Z0-9]{6,10}\b/,
  },
  {
    id: 'meta-access-token',
    label: "Jeton d'accès Meta (EAA...) codé en dur",
    severity: 'high',
    pattern: /\bEAA[A-Za-z0-9]{20,}\b/,
  },
  {
    id: 'meta-pixel-id-assignment',
    label: 'Identifiant de pixel Meta potentiellement codé en dur',
    severity: 'medium',
    pattern: /pixel[_-]?id\s*[:=]\s*['"]?\d{15,16}['"]?/i,
  },
  {
    id: 'linkedin-partner-id-assignment',
    label: 'Identifiant partenaire LinkedIn Insight Tag potentiellement codé en dur',
    severity: 'medium',
    pattern: /(linkedin|insight)[a-z_]*(partner|tag)[a-z_]*id\s*[:=]\s*['"]?\d{4,9}['"]?/i,
  },
  {
    id: 'generic-secret-assignment',
    label: 'Valeur ressemblant à un secret/token assignée en dur (hors process.env)',
    severity: 'high',
    pattern:
      /\b(const|let|var)\s+\w*(token|secret|api[_-]?key|access[_-]?key)\w*\s*[:=]\s*['"]([^'"]{12,})['"]/i,
  },
  {
    id: 'raw-email-in-source',
    label: 'Adresse e-mail en clair détectée dans le code (risque de PII)',
    severity: 'high',
    pattern: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/,
  },
];

const SENSITIVE_ENV_KEY_PATTERN =
  /(TOKEN|SECRET|API[_-]?KEY|ACCESS[_-]?KEY|CLIENT[_-]?SECRET|CONVERSION[_-]?ID|PIXEL[_-]?ID|PARTNER[_-]?ID|MEASUREMENT[_-]?ID)/i;

const HIGH_SEVERITY_ENV_KEY_PATTERN =
  /(TOKEN|SECRET|API[_-]?KEY|ACCESS[_-]?KEY|CLIENT[_-]?SECRET)/i;

const CONSENT_KEY_PATTERN = /consent/i;

const PLACEHOLDER_EMAIL_DOMAIN_PATTERN =
  /^(example\.(com|org|net)|test\.(com|local)|localhost|.*\.example)$/i;

function isProcessEnvRead(line: string): boolean {
  return /process\.env\./.test(line);
}

function isPlaceholderEmail(email: string): boolean {
  const domain = email.split('@')[1] ?? '';
  return PLACEHOLDER_EMAIL_DOMAIN_PATTERN.test(domain);
}

function redactLine(line: string, matchedValue: string): string {
  const redacted = line.split(matchedValue).join('[REDACTED]');
  const trimmed = redacted.trim();
  return trimmed.length > 160 ? `${trimmed.slice(0, 160)}…` : trimmed;
}

export function isEnvFile(filePath: string): boolean {
  return basename(filePath).startsWith('.env');
}

export function scanFileContent(filePath: string, content: string): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (isProcessEnvRead(line)) {
      return;
    }

    for (const rule of LITERAL_RULES) {
      const match = rule.pattern.exec(line);
      if (!match) {
        continue;
      }

      if (rule.id === 'raw-email-in-source' && isPlaceholderEmail(match[0])) {
        continue;
      }

      findings.push({
        file: filePath,
        line: index + 1,
        ruleId: rule.id,
        label: rule.label,
        severity: rule.severity,
        context: redactLine(line, match[0]),
      });
    }
  });

  return findings;
}

export function scanEnvFileContent(filePath: string, content: string): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!SENSITIVE_ENV_KEY_PATTERN.test(key)) {
      return;
    }

    if (value === '' || PLACEHOLDER_VALUE_PATTERN.test(value)) {
      return;
    }

    findings.push({
      file: filePath,
      line: index + 1,
      ruleId: 'env-sensitive-key-with-literal-value',
      label:
        `Variable "${key}" définie avec une valeur littérale ` +
        '(attendu : vide ou référence externe dans un .env.example)',
      severity: HIGH_SEVERITY_ENV_KEY_PATTERN.test(key) ? 'high' : 'medium',
      context: `${key}=[REDACTED]`,
    });
  });

  return findings;
}

export function hasConsentVariable(files: SourceFile[]): boolean {
  return files.some((file) => {
    if (!isEnvFile(file.path)) {
      return false;
    }

    return file.content.split(/\r?\n/).some((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return false;
      }
      const key = trimmed.split('=')[0]?.trim() ?? '';
      return CONSENT_KEY_PATTERN.test(key);
    });
  });
}

export function auditFiles(files: SourceFile[]): AuditReport {
  const findings: AuditFinding[] = [];

  for (const file of files) {
    findings.push(...scanFileContent(file.path, file.content));
    if (isEnvFile(file.path)) {
      findings.push(...scanEnvFileContent(file.path, file.content));
    }
  }

  return { findings, hasConsentVariable: hasConsentVariable(files) };
}

export function generateAuditReport(report: AuditReport): string {
  const lines: string[] = [];

  lines.push("# Rapport d'audit — configuration de tracking");
  lines.push('');
  lines.push(
    'Détection heuristique par expressions régulières : des faux positifs et faux négatifs ' +
      'sont possibles. Ce rapport ne remplace pas une revue manuelle. Aucune valeur détectée ' +
      "n'est révélée ci-dessous.",
  );
  lines.push('');

  lines.push('## Consentement');
  lines.push('');
  lines.push(
    report.hasConsentVariable
      ? '- Une variable liée au consentement a été détectée dans un fichier `.env` — vérifier ' +
          "qu'elle est bien utilisée pour conditionner l'activation des pixels/appels " +
          'server-side.'
      : '- **Aucune variable de consentement détectée.** Un mécanisme de consentement doit être ' +
          "documenté et implémenté avant d'activer un pixel publicitaire ou un appel " +
          'server-side.',
  );
  lines.push('');

  lines.push('## Valeurs suspectes détectées');
  lines.push('');
  if (report.findings.length === 0) {
    lines.push('Aucune valeur suspecte détectée.');
  } else {
    lines.push('| Fichier | Ligne | Sévérité | Constat |');
    lines.push('| --- | --- | --- | --- |');
    for (const finding of report.findings) {
      lines.push(`| ${finding.file} | ${finding.line} | ${finding.severity} | ${finding.label} |`);
    }
  }
  lines.push('');

  const highSeverityCount = report.findings.filter((finding) => finding.severity === 'high').length;
  lines.push('## Résumé');
  lines.push('');
  lines.push(
    `- ${report.findings.length} constat(s) au total, dont ${highSeverityCount} de sévérité haute.`,
  );
  lines.push(
    report.hasConsentVariable
      ? '- Variable de consentement : détectée.'
      : '- Variable de consentement : absente.',
  );
  lines.push('');

  return lines.join('\n');
}

const EXCLUDED_DIR_SEGMENTS = new Set(['node_modules', 'dist', '.git', '.next', 'coverage']);
const RELEVANT_EXTENSIONS = new Set(['.ts', '.tsx', '.json', '.yml', '.yaml']);

function collectSourceFiles(rootDir: string): SourceFile[] {
  const entries = readdirSync(rootDir, { recursive: true }) as string[];
  const files: SourceFile[] = [];

  for (const relativePath of entries) {
    if (relativePath.split(/[\\/]/).some((segment) => EXCLUDED_DIR_SEGMENTS.has(segment))) {
      continue;
    }

    const fullPath = join(rootDir, relativePath);

    let isFile: boolean;
    try {
      isFile = statSync(fullPath).isFile();
    } catch {
      continue;
    }
    if (!isFile) {
      continue;
    }

    const base = basename(fullPath);
    const isEnv = base.startsWith('.env');
    const isRelevantExt = RELEVANT_EXTENSIONS.has(extname(fullPath));

    if (!isEnv && !isRelevantExt) {
      continue;
    }

    files.push({ path: relativePath, content: readFileSync(fullPath, 'utf8') });
  }

  return files;
}

function main(): void {
  const targetDir = process.argv[2];
  if (!targetDir) {
    process.stderr.write('Usage: audit-tracking-config.ts <répertoire>\n');
    process.exitCode = 1;
    return;
  }

  let files: SourceFile[];
  try {
    files = collectSourceFiles(targetDir);
  } catch (error) {
    process.stdout.write(
      `ERREUR: impossible de lire le répertoire "${targetDir}" — ${(error as Error).message}\n`,
    );
    process.exitCode = 1;
    return;
  }

  const report = auditFiles(files);
  process.stdout.write(generateAuditReport(report));

  const hasHighSeverityFinding = report.findings.some((finding) => finding.severity === 'high');
  if (hasHighSeverityFinding) {
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && fileURLToPath(import.meta.url) === resolve(invokedPath)) {
  main();
}
