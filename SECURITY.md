# Politique de sécurité

## Signaler une vulnérabilité

Si vous découvrez une vulnérabilité dans ce dépôt (skill, script, template), merci de **ne pas**
ouvrir d'issue publique. Ouvrez plutôt une [GitHub Security Advisory](../../security/advisories/new)
sur ce dépôt, ou contactez le mainteneur directement via le profil GitHub associé au dépôt.

Merci d'inclure :

- une description du problème et de son impact potentiel ;
- les étapes de reproduction ;
- la version/commit concerné.

## Portée

Ce dépôt ne contient aucun secret, token, identifiant réel ou donnée personnelle. Tous les
scripts et templates fournis sont conçus pour :

- lire les valeurs sensibles (clés API, pixel ID, tokens) exclusivement depuis des variables
  d'environnement, jamais en dur dans le code ;
- fonctionner en mode **dry-run par défaut** pour toute action irréversible ou tout appel vers une
  plateforme tierce (ex: conversion API publicitaire) ;
- hasher les données personnelles (email, téléphone) avant toute transmission externe simulée.

Si vous constatez qu'un fichier de ce dépôt contredit ces principes (secret commité, appel réseau
non confirmé, donnée personnelle en clair), c'est considéré comme une vulnérabilité à signaler.

## Bonnes pratiques pour les contributeurs

- Ne jamais committer de fichier `.env`, clé API, ou token, même de test.
- Ne jamais coder en dur un pixel ID ou un identifiant de compte publicitaire réel, y compris dans
  des exemples ou de la documentation.
- Toute PR ajoutant un appel réseau réel vers un service tiers doit documenter explicitement le
  mécanisme de confirmation utilisateur associé.
