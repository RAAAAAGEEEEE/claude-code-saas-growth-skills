# Convention de nommage des événements

## Règles

1. `objet_action`, snake_case strict : `[a-z][a-z0-9_]*`.
2. L'objet en premier, l'action au participe passé ou présent simple ensuite.
3. Pas d'abréviations ambiguës (`sgnp_ok` interdit, préférer `signup_completed`).
4. Un événement par intention métier — ne pas réutiliser un même événement générique
   (`button_clicked`) pour des actions différentes ; préférer un événement par action réelle.

## Exemples valides

- `signup_completed`
- `checkout_started`
- `checkout_completed`
- `invite_sent`
- `trial_expired`
- `subscription_cancelled`

## Exemples invalides et correction

| Invalide             | Problème                         | Correction                                                 |
| -------------------- | -------------------------------- | ---------------------------------------------------------- |
| `Clicked`            | Verbe seul, PascalCase           | `cta_clicked` (préciser le CTA via une propriété `cta_id`) |
| `signup-completed`   | Kebab-case au lieu de snake_case | `signup_completed`                                         |
| `SignupCompleted`    | PascalCase                       | `signup_completed`                                         |
| `event1`             | Non descriptif                   | Nommer l'action réelle                                     |
| `user_did_something` | Trop vague                       | Préciser l'action métier exacte                            |
