import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  hashEmail,
  hashPhone,
  normalizeEmail,
  normalizePhone,
} from '../skills/ads-conversion-tracking/scripts/hash-pii.js';

test('normalise un email en minuscule sans espaces', () => {
  assert.equal(normalizeEmail('  Test@Example.com '), 'test@example.com');
});

test('normalise un téléphone en ne gardant que les chiffres', () => {
  assert.equal(normalizePhone('+33 6 12 34 56 78'), '33612345678');
});

test('produit un hash déterministe et non réversible pour un email', () => {
  const hash1 = hashEmail('Test@Example.com');
  const hash2 = hashEmail('test@example.com');
  assert.equal(hash1, hash2);
  assert.equal(hash1.length, 64);
});

test('produit des hashes différents pour des téléphones différents', () => {
  const hash1 = hashPhone('+33612345678');
  const hash2 = hashPhone('+33698765432');
  assert.notEqual(hash1, hash2);
});
