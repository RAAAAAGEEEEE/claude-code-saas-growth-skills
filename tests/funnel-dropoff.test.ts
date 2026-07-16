import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  computeFunnelDropoff,
  findWorstDropoffStep,
} from '../skills/saas-funnel-diagnosis/scripts/funnel-dropoff.js';

test('calcule les taux de conversion entre étapes', () => {
  const results = computeFunnelDropoff([
    { name: 'signup_completed', count: 1000 },
    { name: 'activation_completed', count: 400 },
    { name: 'checkout_completed', count: 100 },
  ]);

  assert.equal(results[0].conversionFromPrevious, null);
  assert.equal(results[1].conversionFromPrevious, 0.4);
  assert.equal(results[2].conversionFromPrevious, 0.25);
});

test("identifie l'étape avec le plus fort abandon", () => {
  const results = computeFunnelDropoff([
    { name: 'signup_completed', count: 1000 },
    { name: 'activation_completed', count: 400 },
    { name: 'checkout_completed', count: 350 },
  ]);

  const worst = findWorstDropoffStep(results);
  assert.equal(worst?.name, 'activation_completed');
});

test('retourne null si aucune étape avec abandon calculable', () => {
  const results = computeFunnelDropoff([{ name: 'signup_completed', count: 1000 }]);
  assert.equal(findWorstDropoffStep(results), null);
});
