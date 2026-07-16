# Plan de tracking de conversion — {{nom_du_projet}}

Ce document formalise une conversion publicitaire avant toute implémentation. Une ligne du
tableau = une conversion suivie sur un canal donné. Aucune implémentation ne doit démarrer avant
que la ligne correspondante soit remplie et validée explicitement par l'utilisateur (voir
SKILL.md, étape « Confirmation »).

| Provider     | Objectif de conversion | Événement source (produit) | Déclencheur                    | Données envoyées         | Consentement requis        | Rollback               | Validation                |
| ------------ | ---------------------- | -------------------------- | ------------------------------ | ------------------------ | -------------------------- | ---------------------- | ------------------------- |
| {{provider}} | {{objectif}}           | {{evenement_produit}}      | {{client_serveur_ou_les_deux}} | {{liste_champs_non_pii}} | {{mecanisme_consentement}} | {{comment_desactiver}} | {{qui_valide_et_comment}} |

## Détail

### Provider

{{provider}} — `google-ads`, `meta-ads`, `linkedin-ads`, `openai-ads`, ou un canal UTM custom.

### Objectif de conversion

{{objectif}} — la métrique business que ce tracking doit permettre de mesurer (ex: essais
gratuits convertis en abonnement payant), pas seulement « envoyer un événement ».

### Événement source

{{evenement_produit}} — doit déjà exister dans le catalogue du skill `saas-event-instrumentation`.
Ne jamais créer un nouvel événement produit uniquement pour satisfaire un besoin publicitaire.

### Déclencheur

{{client_serveur_ou_les_deux}} — une conversion à valeur financière doit être confirmée côté
serveur ; si un pixel client est utilisé en complément, la déduplication via `event_id` partagé
est obligatoire (voir `references/provider-neutral-tracking.md`).

### Données envoyées

{{liste_champs}} — uniquement des champs non identifiants (identifiant d'événement, montant en
centimes, devise, catégorie de plan). Jamais d'email ou téléphone en clair, jamais de nom complet,
adresse, ou IP précise (voir la liste des données interdites dans
`references/provider-neutral-tracking.md`).

### Consentement requis

{{mecanisme_consentement}} — nom précis de la variable, du cookie, ou du champ de state qui
conditionne l'activation de ce tracking. Ce champ ne peut pas être laissé vide : si aucun
mécanisme n'existe, l'indiquer explicitement comme prérequis bloquant.

### Rollback

{{comment_desactiver}} — comment désactiver ce tracking immédiatement si un problème est détecté
(variable d'environnement à désactiver, composant à retirer, etc.).

### Validation

{{qui_valide_et_comment}} — qui doit valider ce plan avant implémentation (responsable produit,
DPO/juridique si applicable selon l'organisation) et comment (revue de ce document, ticket dédié,
etc.). Ce skill ne certifie aucune conformité légale : cette validation reste sous la
responsabilité de la personne désignée.

## Checklist avant implémentation

- [ ] Consentement vérifié et documenté pour ce provider.
- [ ] Aucune PII brute dans les données envoyées (URL, UTM, événement, log).
- [ ] Déduplication client/serveur définie si le déclencheur est « les deux ».
- [ ] `event_id` idempotent généré côté serveur.
- [ ] Rollback documenté.
- [ ] Validation obtenue de la personne responsable désignée.
- [ ] Confirmation explicite de l'utilisateur obtenue avant toute implémentation de code.
- [ ] Confirmation explicite distincte obtenue avant toute activation d'un envoi réseau réel.
