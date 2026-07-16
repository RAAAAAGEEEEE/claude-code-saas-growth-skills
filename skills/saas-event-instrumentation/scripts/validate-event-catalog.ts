/**
 * Valide un catalogue d'événements analytics (YAML) : format, doublons, noms
 * invalides et propriétés interdites (PII potentielle). Script en lecture
 * seule : ne modifie aucun fichier, ne fait aucun appel réseau.
 *
 * Usage : node validate-event-catalog.ts <catalogue.yml>
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { validateEventName } from './validate-event-name.js';

const ALLOWED_STATUSES = new Set(['draft', 'stable', 'deprecated']);
const ALLOWED_TRIGGERS = new Set(['client', 'server', 'both']);
const ALLOWED_PROPERTY_TYPES = new Set(['string', 'number', 'boolean']);

export const FORBIDDEN_PROPERTY_NAMES = [
  'email',
  'phone',
  'password',
  'ssn',
  'social_security_number',
  'credit_card',
  'card_number',
  'full_name',
  'first_name',
  'last_name',
  'address',
  'ip',
  'ip_address',
  'token',
  'access_token',
  'refresh_token',
  'date_of_birth',
  'national_id',
];

export interface CatalogIssue {
  eventName?: string;
  message: string;
}

function isForbiddenPropertyName(name: string): boolean {
  const normalized = name.toLowerCase();
  return FORBIDDEN_PROPERTY_NAMES.some(
    (forbidden) => normalized === forbidden || normalized.includes(forbidden),
  );
}

function validateProperties(eventName: string, properties: unknown, issues: CatalogIssue[]): void {
  if (properties === undefined) {
    return;
  }

  if (!Array.isArray(properties)) {
    issues.push({ eventName, message: '"properties" doit être une liste.' });
    return;
  }

  const seenPropertyNames = new Set<string>();

  properties.forEach((rawProperty, index) => {
    if (typeof rawProperty !== 'object' || rawProperty === null) {
      issues.push({ eventName, message: `Propriété à l'index ${index} : doit être un objet.` });
      return;
    }

    const property = rawProperty as Record<string, unknown>;
    const propertyName = typeof property.name === 'string' ? property.name : undefined;

    if (!propertyName) {
      issues.push({ eventName, message: `Propriété à l'index ${index} : "name" manquant.` });
      return;
    }

    if (seenPropertyNames.has(propertyName)) {
      issues.push({ eventName, message: `Propriété en double : "${propertyName}".` });
    }
    seenPropertyNames.add(propertyName);

    if (isForbiddenPropertyName(propertyName)) {
      issues.push({
        eventName,
        message: `Propriété interdite (PII potentielle) : "${propertyName}".`,
      });
    }

    if (property.pii === true) {
      issues.push({
        eventName,
        message: `Propriété "${propertyName}" marquée pii: true — interdite dans le catalogue analytics.`,
      });
    }

    if (typeof property.type !== 'string' || !ALLOWED_PROPERTY_TYPES.has(property.type)) {
      issues.push({
        eventName,
        message: `Propriété "${propertyName}" : type invalide (string, number, boolean attendus).`,
      });
    }

    if (property.required !== undefined && typeof property.required !== 'boolean') {
      issues.push({
        eventName,
        message: `Propriété "${propertyName}" : "required" doit être un booléen.`,
      });
    }
  });
}

export function validateEventCatalog(raw: unknown): CatalogIssue[] {
  const issues: CatalogIssue[] = [];

  if (typeof raw !== 'object' || raw === null) {
    return [{ message: 'Le catalogue doit être un objet YAML/JSON valide.' }];
  }

  const catalog = raw as Record<string, unknown>;

  if (catalog.version !== undefined && typeof catalog.version !== 'string') {
    issues.push({ message: '"version" doit être une chaîne si elle est fournie.' });
  }

  const events = catalog.events;
  if (!Array.isArray(events)) {
    return [...issues, { message: 'Le catalogue doit contenir une liste "events".' }];
  }

  const seenEventNames = new Set<string>();

  events.forEach((rawEvent, index) => {
    if (typeof rawEvent !== 'object' || rawEvent === null) {
      issues.push({ message: `Événement à l'index ${index} : doit être un objet.` });
      return;
    }

    const event = rawEvent as Record<string, unknown>;
    const name = typeof event.name === 'string' ? event.name : undefined;

    if (!name) {
      issues.push({
        message: `Événement à l'index ${index} : propriété "name" manquante ou invalide.`,
      });
      return;
    }

    const nameValidation = validateEventName(name);
    if (!nameValidation.valid) {
      issues.push({ eventName: name, message: `Nom invalide : ${nameValidation.reason}` });
    }

    if (seenEventNames.has(name)) {
      issues.push({ eventName: name, message: 'Nom en double dans le catalogue.' });
    }
    seenEventNames.add(name);

    if (typeof event.description !== 'string' || event.description.trim().length === 0) {
      issues.push({ eventName: name, message: 'Description manquante.' });
    }

    if (typeof event.owner !== 'string' || event.owner.trim().length === 0) {
      issues.push({ eventName: name, message: 'Owner manquant.' });
    }

    if (typeof event.status !== 'string' || !ALLOWED_STATUSES.has(event.status)) {
      issues.push({
        eventName: name,
        message: `Status invalide : doit être l'un de ${[...ALLOWED_STATUSES].join(', ')}.`,
      });
    }

    if (typeof event.trigger !== 'string' || !ALLOWED_TRIGGERS.has(event.trigger)) {
      issues.push({
        eventName: name,
        message: `Trigger invalide : doit être l'un de ${[...ALLOWED_TRIGGERS].join(', ')}.`,
      });
    }

    if (event.since !== undefined) {
      if (typeof event.since !== 'string' || event.since.trim().length === 0) {
        issues.push({
          eventName: name,
          message: '"since" doit être une chaîne non vide si fournie.',
        });
      }
    }

    validateProperties(name, event.properties, issues);
  });

  return issues;
}

function main(): void {
  const filePath = process.argv[2];
  if (!filePath) {
    process.stderr.write('Usage: validate-event-catalog.ts <catalogue.yml>\n');
    process.exitCode = 1;
    return;
  }

  let raw: unknown;
  try {
    const content = readFileSync(filePath, 'utf8');
    raw = parse(content);
  } catch (error) {
    process.stdout.write(
      `ERREUR: impossible de lire/parser le fichier "${filePath}" — ${(error as Error).message}\n`,
    );
    process.exitCode = 1;
    return;
  }

  const issues = validateEventCatalog(raw);

  if (issues.length === 0) {
    process.stdout.write(`OK: le catalogue "${filePath}" est valide.\n`);
    return;
  }

  process.stdout.write(`INVALIDE: ${issues.length} problème(s) détecté(s) dans "${filePath}"\n`);
  for (const issue of issues) {
    const label = issue.eventName ? `[${issue.eventName}]` : '[catalogue]';
    process.stdout.write(`  ${label} ${issue.message}\n`);
  }
  process.exitCode = 1;
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && fileURLToPath(import.meta.url) === resolve(invokedPath)) {
  main();
}
