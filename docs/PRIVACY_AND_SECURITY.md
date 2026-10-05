# Confidentialité et sécurité

Signalement des vulnérabilités : [SECURITY.md](../SECURITY.md).

- **Rien ne sort par défaut.** Les scripts du dépôt ne font aucun appel réseau. Les templates
  construisant un appel externe restent en dry-run tant que `CONVERSION_DRY_RUN` n'est pas
  exactement `false` ([CONFIGURATION.md](CONFIGURATION.md)).
- **Confirmation explicite** avant toute action externe ou irréversible (voir les `SKILL.md`).
- **Données personnelles.** `skills/ads-conversion-tracking/scripts/hash-pii.ts` normalise puis
  hashe en SHA-256, localement, l'email (minuscules, espaces retirés) et le téléphone (chiffres
  seuls). Un hash n'est pas une anonymisation : traitez-le comme une donnée personnelle.
- **Catalogue d'événements.** `validate-event-catalog.ts` détecte les propriétés interdites
  (PII potentielle).
- **Secrets.** `audit-tracking-config.ts` repère des secrets codés en dur et l'absence de
  variable de consentement, sans jamais afficher la valeur détectée. Détection heuristique
  ([LIMITATIONS.md](LIMITATIONS.md)).
- **Consentement.** Le skill publicitaire exige une stratégie de consentement validée avant tout
  pixel ou appel serveur. Il ne garantit aucune conformité légale.
- Ne commitez jamais de clé, token, identifiant de pixel réel ni donnée personnelle.
