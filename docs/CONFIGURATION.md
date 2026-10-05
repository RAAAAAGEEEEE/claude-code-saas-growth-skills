# Configuration

Les skills eux-mêmes n'ont aucun réglage : ils se paramètrent par leurs arguments
(voir [USAGE.md](USAGE.md)). Seuls l'exemple et un template lisent des variables d'environnement.

| Variable                              | Où                                                                        | Rôle                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `NEXT_PUBLIC_POSTHOG_KEY`             | `examples/nextjs-posthog/.env.example`                                    | Clé projet PostHog. Vide : intégration désactivée, aucun événement envoyé. |
| `NEXT_PUBLIC_POSTHOG_HOST`            | idem                                                                      | URL de votre instance PostHog (valeur d'exemple fictive dans le fichier).  |
| `NEXT_PUBLIC_ADS_CONSENT_COOKIE_NAME` | idem                                                                      | Nom du cookie ou état de consentement publicitaire. Vide : aucun tracking. |
| `CONVERSION_DRY_RUN`                  | `skills/ads-conversion-tracking/templates/conversion-payload.template.ts` | Dry-run actif sauf si la valeur est exactement `false`.                    |

Copiez `examples/nextjs-posthog/.env.example` en `.env.local` et renseignez vos propres valeurs ;
`.env.*` est ignoré par git (sauf `.env.example`). Ne commitez jamais de valeur réelle. Voir
[PRIVACY_AND_SECURITY.md](PRIVACY_AND_SECURITY.md).
