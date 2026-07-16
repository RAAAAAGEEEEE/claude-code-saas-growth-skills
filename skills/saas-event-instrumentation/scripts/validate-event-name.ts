/**
 * Valide un nom d'événement analytics par rapport à la convention objet_action en snake_case.
 * Script en lecture seule : ne modifie aucun fichier, ne fait aucun appel réseau.
 *
 * Usage : node validate-event-name.ts <event_name>
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EVENT_NAME_PATTERN = /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/;

const VAGUE_VERBS = new Set(['clicked', 'did', 'something', 'event', 'action']);

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateEventName(name: string): ValidationResult {
  if (name.length === 0) {
    return { valid: false, reason: 'Le nom ne peut pas être vide.' };
  }

  if (!EVENT_NAME_PATTERN.test(name)) {
    return {
      valid: false,
      reason:
        'Le nom doit être en snake_case et suivre le format objet_action (ex: signup_completed).',
    };
  }

  const firstSegment = name.split('_')[0];
  if (VAGUE_VERBS.has(firstSegment)) {
    return {
      valid: false,
      reason: `"${firstSegment}" est trop vague comme objet — préciser l'entité métier concernée.`,
    };
  }

  return { valid: true };
}

function main(): void {
  const name = process.argv[2];
  if (!name) {
    process.stderr.write('Usage: validate-event-name.ts <event_name>\n');
    process.exitCode = 1;
    return;
  }

  const result = validateEventName(name);
  if (result.valid) {
    process.stdout.write(`OK: "${name}" respecte la convention.\n`);
  } else {
    process.stdout.write(`INVALIDE: "${name}" — ${result.reason}\n`);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && fileURLToPath(import.meta.url) === resolve(invokedPath)) {
  main();
}
