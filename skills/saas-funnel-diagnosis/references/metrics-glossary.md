# Glossaire des métriques SaaS

Définitions courtes et formules explicites, pour garder un vocabulaire cohérent entre le rapport
de diagnostic et les échanges avec l'utilisateur. Ces métriques se calculent à partir d'agrégats
déjà fournis — ce skill ne les dérive jamais de données individuelles identifiantes.

## Activation

Proportion d'utilisateurs ayant atteint un événement définissant une première valeur perçue du
produit (ex: `onboarding_completed`, `feature_used`), parmi ceux ayant terminé l'inscription.

```
taux_activation = utilisateurs_actives / utilisateurs_inscrits
```

L'événement qui définit l'activation est spécifique à chaque produit — il doit être choisi avec
l'utilisateur, jamais présumé.

## Conversion

Proportion d'utilisateurs passant d'une étape à la suivante dans un funnel.

```
taux_conversion(etape_n) = utilisateurs(etape_n) / utilisateurs(etape_n-1)
```

Le complément est le **taux d'abandon** :

```
taux_abandon(etape_n) = 1 - taux_conversion(etape_n)
```

## Rétention

Proportion d'utilisateurs actifs à un instant `t` qui sont toujours actifs à un instant ultérieur
`t + période`, généralement mesurée par cohorte (voir plus bas).

```
taux_retention(periode) = utilisateurs_actifs_a(periode) / utilisateurs_actifs_a(0)
```

## Churn

Proportion d'utilisateurs (ou d'abonnements) perdus sur une période donnée, complément inverse de
la rétention sur cette même période.

```
taux_churn(periode) = 1 - taux_retention(periode)
```

Le **churn revenu** (revenu perdu, indépendamment du nombre de comptes) est une métrique distincte
et souvent plus révélatrice pour un SaaS B2B :

```
churn_revenu(periode) = MRR_perdu(periode) / MRR_debut_de_periode
```

## Cohortes

Un groupe d'utilisateurs partageant un point de départ commun (ex: mois d'inscription), suivi dans
le temps pour mesurer rétention ou conversion sans mélanger des utilisateurs à des stades de cycle
de vie différents.

```
cohorte(mois_M) = { utilisateurs inscrits pendant le mois M }
```

Comparer des taux de conversion sans distinguer les cohortes peut masquer une dégradation récente
noyée dans un historique plus favorable — toujours préciser la période d'une cohorte dans un
rapport.

## ARPU (Average Revenue Per User)

Revenu moyen généré par utilisateur actif sur une période donnée.

```
ARPU(periode) = revenu_total(periode) / utilisateurs_actifs(periode)
```

## MRR (Monthly Recurring Revenue)

Revenu récurrent mensuel normalisé, agrégeant tous les abonnements actifs ramenés à une base
mensuelle.

```
MRR = somme(montant_mensuel_normalise de chaque abonnement actif)
```

Décomposition utile pour un diagnostic de funnel de revenu :

```
MRR(fin_periode) = MRR(debut_periode) + MRR_nouveau + MRR_expansion - MRR_churn - MRR_contraction
```

- `MRR_nouveau` : nouveaux abonnements sur la période.
- `MRR_expansion` : montée en gamme d'abonnements existants.
- `MRR_churn` : abonnements résiliés sur la période.
- `MRR_contraction` : abonnements existants passés à un plan inférieur.
