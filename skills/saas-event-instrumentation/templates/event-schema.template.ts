/**
 * Modèle de schéma d'événements analytics type-safe.
 * Copier ce fichier dans le projet cible (ex: lib/analytics/events.ts) et l'adapter.
 */

export interface AppEventMap {
  signup_completed: {
    plan: 'free' | 'pro' | 'enterprise';
    source: string;
  };
  checkout_started: {
    plan: 'pro' | 'enterprise';
    amount_cents: number;
    currency: string;
  };
  checkout_completed: {
    plan: 'pro' | 'enterprise';
    amount_cents: number;
    currency: string;
  };
  trial_expired: {
    plan: 'pro' | 'enterprise';
    days_active: number;
  };
}

export type AppEventName = keyof AppEventMap;

export type AppEventProperties<TName extends AppEventName> = AppEventMap[TName];
