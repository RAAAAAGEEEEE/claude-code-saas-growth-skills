# Exemple : Next.js App Router + PostHog self-hosted

Exemple minimal illustrant la convention documentée dans le skill
[saas-event-instrumentation](../../skills/saas-event-instrumentation/SKILL.md), pour une instance
PostHog auto-hébergée (VPS) plutôt que PostHog Cloud.

Aucun identifiant réel n'est présent : les valeurs viennent de variables d'environnement à définir
localement, jamais commitées.

## Installation locale

```bash
cp examples/nextjs-posthog/.env.example examples/nextjs-posthog/.env.local
```

Par défaut, `.env.local` contient `NEXT_PUBLIC_POSTHOG_KEY` **vide**. Dans cet état,
[`lib/posthog-client.ts`](lib/posthog-client.ts) renvoie `null` (voir
`readPostHogConfigFromEnv`) et aucun événement n'est envoyé — l'exemple reste fonctionnel et
inspectable sans qu'une instance PostHog réelle soit configurée.

Pour activer réellement l'envoi d'événements, renseignez dans `.env.local` :

```bash
NEXT_PUBLIC_POSTHOG_HOST=https://posthog.votre-domaine.example
NEXT_PUBLIC_POSTHOG_KEY=phc_votre_cle_projet
```

Ces valeurs doivent provenir de votre propre instance PostHog (self-hosted ou cloud) — ne jamais
copier de clé d'exemple ou de production dans ce dépôt.

## Fichiers

- [`.env.example`](.env.example) : modèle de variables d'environnement, clé vide par défaut.
- [`lib/posthog-client.ts`](lib/posthog-client.ts) : initialisation du client PostHog côté
  navigateur, host configurable (self-hosted par défaut), no-op si la clé est absente.
- [`lib/track-signup-completed.ts`](lib/track-signup-completed.ts) : exemple d'envoi d'un événement
  suivant la convention `objet_action` et la taxonomie du skill.
- [`lib/subscription-started-ad-conversion.ts`](lib/subscription-started-ad-conversion.ts) :
  exemple du skill [ads-conversion-tracking](../../skills/ads-conversion-tracking/SKILL.md) —
  construit un payload de conversion publicitaire `subscription_started` **strictement
  conditionné par le consentement** (`buildSubscriptionStartedAdConversion` renvoie `null` si
  `advertisingConsentGranted` est `false`). Aucun appel réseau réel n'est effectué : le payload
  retourné est toujours `dry_run: true`, à titre illustratif uniquement. Le consentement lui-même
  doit être vérifié via le mécanisme documenté par `NEXT_PUBLIC_ADS_CONSENT_COOKIE_NAME` (voir
  `.env.example`), qui reste vide tant qu'aucune stratégie de consentement n'est implémentée.

## Déploiement

Cet exemple ne suppose aucune plateforme d'hébergement particulière. Pour un déploiement sur VPS
self-hosted, s'assurer que `NEXT_PUBLIC_POSTHOG_HOST` pointe vers l'instance PostHog interne ou
publique, et que le reverse proxy autorise les requêtes vers `/e/` et `/decide/`.
