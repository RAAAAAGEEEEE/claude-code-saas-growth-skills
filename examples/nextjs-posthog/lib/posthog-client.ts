/**
 * Initialisation minimale d'un client PostHog côté navigateur pour une
 * instance self-hosted (VPS) ou PostHog Cloud, selon les variables d'environnement.
 *
 * Aucune clé réelle n'est codée en dur : NEXT_PUBLIC_POSTHOG_KEY et
 * NEXT_PUBLIC_POSTHOG_HOST doivent être définies dans l'environnement de
 * déploiement cible.
 */

export interface PostHogClientConfig {
  apiKey: string;
  apiHost: string;
}

export function readPostHogConfigFromEnv(): PostHogClientConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!apiKey || !apiHost) {
    return null;
  }

  return { apiKey, apiHost };
}
