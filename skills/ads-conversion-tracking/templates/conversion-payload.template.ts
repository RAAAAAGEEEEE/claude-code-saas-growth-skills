/**
 * Modèle de payload de conversion server-side avec event_id partagé pour la
 * déduplication avec le pixel client. Aucun identifiant réel ne doit être codé en dur :
 * toutes les valeurs sensibles viennent de variables d'environnement.
 *
 * Mode dry-run par défaut : DRY_RUN doit valoir explicitement "false" pour
 * qu'un appel réel soit envisagé, et cet appel reste alors à la charge du
 * code d'intégration final, pas de ce template.
 */

import { randomUUID } from 'node:crypto';
import { hashEmail } from '../scripts/hash-pii.js';

export interface ConversionEventInput {
  eventName: 'signup_completed' | 'checkout_completed';
  email?: string;
  valueCents?: number;
  currency?: string;
}

export interface ConversionPayload {
  event_id: string;
  event_name: ConversionEventInput['eventName'];
  hashed_email?: string;
  value_cents?: number;
  currency?: string;
  dry_run: boolean;
}

const DRY_RUN = process.env.CONVERSION_DRY_RUN !== 'false';

export function buildConversionPayload(
  input: ConversionEventInput,
  eventId: string = randomUUID(),
): ConversionPayload {
  return {
    event_id: eventId,
    event_name: input.eventName,
    hashed_email: input.email ? hashEmail(input.email) : undefined,
    value_cents: input.valueCents,
    currency: input.currency,
    dry_run: DRY_RUN,
  };
}
