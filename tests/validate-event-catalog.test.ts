import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parse } from 'yaml';
import {
  FORBIDDEN_PROPERTY_NAMES,
  validateEventCatalog,
} from '../skills/saas-event-instrumentation/scripts/validate-event-catalog.js';

const baseEvent = {
  description: 'Description de test.',
  owner: 'growth',
  status: 'draft' as const,
  trigger: 'server' as const,
};

test('le catalogue modèle fourni dans le dépôt est valide', () => {
  const content = readFileSync(
    'skills/saas-event-instrumentation/templates/event-catalog.yml',
    'utf8',
  );
  const catalog = parse(content);
  const issues = validateEventCatalog(catalog);
  assert.deepEqual(issues, []);
});

test('accepte un catalogue minimal valide', () => {
  const issues = validateEventCatalog({
    events: [
      {
        name: 'signup_completed',
        ...baseEvent,
        status: 'stable',
        properties: [{ name: 'plan', type: 'string', required: true }],
      },
    ],
  });
  assert.deepEqual(issues, []);
});

test("rejette un catalogue sans liste d'événements", () => {
  const issues = validateEventCatalog({});
  assert.ok(issues.some((issue) => issue.message.includes('"events"')));
});

test('rejette un nom événement au mauvais format', () => {
  const issues = validateEventCatalog({
    events: [{ name: 'Signup-Completed', ...baseEvent }],
  });
  assert.ok(issues.some((issue) => issue.message.includes('Nom invalide')));
});

test("rejette un doublon de nom d'événement", () => {
  const issues = validateEventCatalog({
    events: [
      { name: 'signup_completed', ...baseEvent },
      { name: 'signup_completed', ...baseEvent },
    ],
  });
  assert.ok(issues.some((issue) => issue.message.includes('double')));
});

test('rejette une propriété interdite (PII potentielle)', () => {
  const issues = validateEventCatalog({
    events: [
      {
        name: 'signup_completed',
        ...baseEvent,
        properties: [{ name: 'email', type: 'string', required: true }],
      },
    ],
  });
  assert.ok(issues.some((issue) => issue.message.includes('interdite')));
});

test('rejette une propriété marquée pii: true même si le nom semble neutre', () => {
  const issues = validateEventCatalog({
    events: [
      {
        name: 'signup_completed',
        ...baseEvent,
        properties: [{ name: 'contact_detail', type: 'string', required: true, pii: true }],
      },
    ],
  });
  assert.ok(issues.some((issue) => issue.message.includes('pii: true')));
});

test('rejette un status invalide', () => {
  const issues = validateEventCatalog({
    events: [{ name: 'signup_completed', ...baseEvent, status: 'wip' }],
  });
  assert.ok(issues.some((issue) => issue.message.includes('Status invalide')));
});

test('rejette un trigger invalide', () => {
  const issues = validateEventCatalog({
    events: [{ name: 'signup_completed', ...baseEvent, trigger: 'browser-extension' }],
  });
  assert.ok(issues.some((issue) => issue.message.includes('Trigger invalide')));
});

test('rejette un type de propriété invalide', () => {
  const issues = validateEventCatalog({
    events: [
      {
        name: 'signup_completed',
        ...baseEvent,
        properties: [{ name: 'metadata', type: 'object', required: false }],
      },
    ],
  });
  assert.ok(issues.some((issue) => issue.message.includes('type invalide')));
});

test('la liste des propriétés interdites contient les identifiants personnels courants', () => {
  assert.ok(FORBIDDEN_PROPERTY_NAMES.includes('email'));
  assert.ok(FORBIDDEN_PROPERTY_NAMES.includes('phone'));
  assert.ok(FORBIDDEN_PROPERTY_NAMES.includes('full_name'));
});
