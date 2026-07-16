---
name: saas-funnel-diagnosis
description: Transforme un export agrégé de métriques SaaS (signup, activation, paiement) en diagnostic de funnel actionnable — calcul des taux de conversion, détection du goulot principal, hypothèses mesurables, plan d'expérimentation priorisé. Invocation manuelle uniquement, jamais automatique.
argument-hint: '[fichier-csv-ou-chemin]'
disable-model-invocation: true
---

# saas-funnel-diagnosis

## Invocation

Ce skill s'invoque **uniquement manuellement**, jamais automatiquement à partir d'une simple
mention de conversion ou de métriques dans la conversation :

```
/saas-funnel-diagnosis exports/funnel-2026-06.csv
```

`[fichier-csv-ou-chemin]` désigne un fichier CSV agrégé (colonnes : étape, utilisateurs, période)
ou un chemin vers un export déjà produit (dashboard PostHog exporté, requête HogQL déjà exécutée).
Si votre version de Claude Code ne fait pas encore respecter `disable-model-invocation` pour les
skills, respectez tout de même cette contrainte : n'exécutez la procédure ci-dessous que sur
demande explicite de l'utilisateur.

## Contraintes non négociables

- **Lecture seule** : ce skill n'écrit et ne modifie aucun fichier de code sans confirmation
  explicite (voir « Confirmation avant modification de code » ci-dessous).
- **Aucun appel API réel** : aucune requête vers PostHog ou tout autre service n'est effectuée ;
  le skill travaille exclusivement sur les données déjà fournies par l'utilisateur.
- **Pas de PII** : ne jamais demander, afficher ou dériver des données personnelles identifiantes.
  Ce skill raisonne sur des agrégats (comptages par étape), jamais sur des lignes utilisateur
  individuelles.
- **Pas de promesse de causalité** : une baisse de conversion entre deux étapes est une
  corrélation observée dans les données, jamais une preuve de cause. Toute hypothèse doit être
  présentée comme telle, jamais comme un fait établi.
- **Limites statistiques toujours signalées** : tout rapport doit mentionner explicitement la
  taille d'échantillon, l'absence de test de significativité, et le risque de conclusion hâtive
  sur des petits volumes.
- **Aucun dark pattern** : aucune hypothèse, expérimentation ou recommandation ne doit reposer sur
  la tromperie, la friction artificielle imposée à l'utilisateur, la culpabilisation, les faux
  comptes à rebours, les cases pré-cochées, ou toute pratique visant à obtenir un consentement ou
  un achat par manipulation plutôt que par valeur réelle.
- **Résultat en français.**
- **Aucun contenu tiers copié** : toute analyse, taxonomie ou formule produite dans ce skill est
  une rédaction originale.

## Protocole obligatoire

### 1. Validation des données

- Vérifier que le fichier fourni contient bien les colonnes attendues (étape, utilisateurs,
  période) — voir [scripts/analyze-funnel.ts](scripts/analyze-funnel.ts) qui effectue cette
  validation automatiquement et signale toute colonne manquante.
- Vérifier qu'aucune colonne ne contient de donnée individuelle (email, identifiant utilisateur
  brut, nom). Si c'est le cas, refuser de continuer et demander un export ré-agrégé.
- Ne jamais halluciner une valeur manquante : si une étape n'a pas de donnée, le signaler comme
  absente plutôt que de l'estimer.

### 2. Calcul du funnel

- Exécuter [scripts/analyze-funnel.ts](scripts/analyze-funnel.ts) sur le fichier fourni :

  ```bash
  npm run build
  node dist/skills/saas-funnel-diagnosis/scripts/analyze-funnel.js <fichier.csv>
  ```

  (le script importe un module local voisin — l'exécuter directement en TypeScript sans
  compilation préalable, y compris via `--experimental-strip-types`, échoue avec une erreur de
  résolution de module ; toujours passer par `npm run build` en premier).

- Le script calcule les taux de conversion et d'abandon étape à étape, détecte les valeurs
  incohérentes (funnel qui croît d'une étape à l'autre, doublons, valeurs négatives), et produit
  un rapport Markdown **déterministe** : mêmes données en entrée, même rapport en sortie.

### 3. Détection du goulot

- Le goulot principal est l'étape avec le taux d'abandon le plus élevé, tel que calculé par le
  script — ne jamais le redéfinir à la main sans justification chiffrée.
- Si plusieurs étapes ont un taux d'abandon proche (écart de quelques points), le signaler
  explicitement plutôt que de trancher artificiellement.

### 4. Hypothèses

- Formuler 2 à 4 hypothèses **mesurables** expliquant l'abandon au goulot identifié (friction UX,
  latence technique, mauvais ciblage du trafic à cette étape, problème d'instrumentation).
- Chaque hypothèse doit être vérifiable par une donnée ou une observation future précise — rejeter
  toute hypothèse qui ne peut pas être confirmée ou infirmée par une mesure.
- Classer les hypothèses avec la méthode **ICE** (Impact, Confiance, Effort — chacun noté de 1 à
  5, score = Impact × Confiance / Effort) dans le rapport final (voir
  [templates/funnel-report.md](templates/funnel-report.md)).

### 5. Expérimentations

- Pour chaque hypothèse retenue, proposer une seule expérimentation ou vérification concrète (ex:
  session replay filtré sur l'étape, test A/B, vérification de logs serveur, entretien
  utilisateur) — jamais une correction directe du produit avant vérification.
- Aucune expérimentation proposée ne doit reposer sur un dark pattern (voir contraintes
  ci-dessus).

### 6. Plan de mesure

- Définir le prochain événement analytics à instrumenter pour combler le manque de visibilité
  identifié, en respectant la convention du skill
  [saas-event-instrumentation](../saas-event-instrumentation/SKILL.md) (nommage `objet_action`,
  absence de PII).
- Ne jamais recommander l'ajout d'un événement sans vérifier qu'il ne dupliquerait pas un
  événement déjà listé dans les données fournies.
- Conclure par une **prochaine action unique recommandée** — pas une liste, un seul point de
  départ priorisé.

## Confirmation avant modification de code

Ce skill est un outil de diagnostic : il ne modifie aucun fichier de code. Si l'analyse débouche
sur une recommandation d'instrumentation (nouvel événement, correction de bug de tracking) qui
implique une modification de code, ce skill doit :

1. Présenter la modification proposée sous forme de plan court (fichiers concernés, nature du
   changement).
2. Attendre une confirmation explicite de l'utilisateur avant d'écrire quoi que ce soit.
3. Rediriger vers le skill [saas-event-instrumentation](../saas-event-instrumentation/SKILL.md)
   pour l'implémentation elle-même plutôt que de la faire depuis ce skill.

## Sortie finale obligatoire

Le rapport final suit le format de [templates/funnel-report.md](templates/funnel-report.md) :
résumé exécutif, tableau des étapes, goulot principal, hypothèses classées ICE, événements à
ajouter, risques et limites, et une prochaine action unique recommandée.

## Fichiers du skill

- [references/metrics-glossary.md](references/metrics-glossary.md) — définitions et formules :
  activation, conversion, rétention, churn, cohortes, ARPU, MRR.
- [references/hypothesis-checklist.md](references/hypothesis-checklist.md) — causes fréquentes
  d'abandon, à utiliser comme point de départ pour l'étape 4, jamais comme diagnostic automatique.
- [templates/funnel-report.md](templates/funnel-report.md) — format du rapport final.
- [scripts/analyze-funnel.ts](scripts/analyze-funnel.ts) — CLI d'analyse : parse un CSV agrégé,
  calcule les conversions, détecte les incohérences, produit le rapport Markdown déterministe. Ne
  dépend d'aucun SDK analytics (pas de PostHog).
- [scripts/funnel-dropoff.ts](scripts/funnel-dropoff.ts) — fonctions pures de calcul de
  conversion/abandon, réutilisées par `analyze-funnel.ts`.

## Règle de sécurité (rappel)

Toute modification d'un événement ou d'un funnel déjà utilisé en production casse potentiellement
des dashboards existants. Ce skill ne propose que des constats et des hypothèses à vérifier ;
toute action corrective reste sous la responsabilité explicite de l'utilisateur, jamais automatisée
depuis ce skill.
