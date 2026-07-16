import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateEventName } from '../skills/saas-event-instrumentation/scripts/validate-event-name.js';

test('accepte un nom objet_action valide', () => {
  const result = validateEventName('signup_completed');
  assert.equal(result.valid, true);
});

test('rejette le kebab-case', () => {
  const result = validateEventName('signup-completed');
  assert.equal(result.valid, false);
});

test('rejette un verbe seul trop vague', () => {
  const result = validateEventName('clicked_button');
  assert.equal(result.valid, false);
});

test('rejette une chaine vide', () => {
  const result = validateEventName('');
  assert.equal(result.valid, false);
});
