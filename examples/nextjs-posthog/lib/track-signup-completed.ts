/**
 * Exemple d'événement de conversion suivant la convention objet_action,
 * déclenché côté serveur (server action / route handler) après confirmation
 * réelle de la création de compte — jamais uniquement côté client.
 */

export interface SignupCompletedProperties {
  plan: 'free' | 'pro' | 'enterprise';
  source: string;
}

export interface TrackedEvent<TProperties> {
  event: 'signup_completed';
  distinctId: string;
  properties: TProperties;
}

export function buildSignupCompletedEvent(
  distinctId: string,
  properties: SignupCompletedProperties,
): TrackedEvent<SignupCompletedProperties> {
  return {
    event: 'signup_completed',
    distinctId,
    properties,
  };
}
