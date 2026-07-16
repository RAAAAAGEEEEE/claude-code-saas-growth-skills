/**
 * Exemple illustratif : construction (sans envoi réel) d'un événement de conversion
 * publicitaire "subscription_started", strictement conditionné par le consentement
 * publicitaire de l'utilisateur.
 *
 * Ce fichier n'effectue aucun appel réseau et ne dépend d'aucun fournisseur (Google Ads,
 * Meta Ads, LinkedIn Ads, etc.) : il illustre uniquement comment dériver un événement
 * produit déjà existant (subscription_started) vers un payload publicitaire minimal,
 * dry-run, sans PII brute. Voir skills/ads-conversion-tracking/SKILL.md pour le workflow
 * complet à suivre avant toute implémentation réelle vers un fournisseur.
 */

import { randomUUID } from 'node:crypto';

export interface AdsConsentState {
  advertisingConsentGranted: boolean;
}

export interface SubscriptionStartedInput {
  plan: 'pro' | 'enterprise';
  amountCents: number;
  currency: string;
}

export interface AdConversionPayload {
  event_id: string;
  event_name: 'subscription_started';
  plan: SubscriptionStartedInput['plan'];
  amount_cents: number;
  currency: string;
  dry_run: true;
}

export function buildSubscriptionStartedAdConversion(
  input: SubscriptionStartedInput,
  consent: AdsConsentState,
  eventId: string = randomUUID(),
): AdConversionPayload | null {
  if (!consent.advertisingConsentGranted) {
    return null;
  }

  return {
    event_id: eventId,
    event_name: 'subscription_started',
    plan: input.plan,
    amount_cents: input.amountCents,
    currency: input.currency,
    dry_run: true,
  };
}
