# Contribuer

Merci de l'intérêt porté à ce dépôt. Les contributions (nouveaux skills, corrections, exemples)
sont bienvenues.

## Avant de proposer un skill

1. Vérifiez qu'un skill équivalent n'existe pas déjà dans [`skills/`](skills/).
2. Un skill doit résoudre un besoin concret pour un solopreneur SaaS ou une équipe dev
   TypeScript/Next.js autour de l'instrumentation produit, du diagnostic de funnel, ou du tracking
   de conversion — pas un besoin générique déjà couvert par la documentation officielle de l'outil
   concerné.
3. Un skill ne doit exécuter aucune action irréversible ou externe sans confirmation explicite de
   l'utilisateur (voir [SECURITY.md](SECURITY.md)).

## Structure attendue d'un skill

```
skills/<nom-du-skill>/
  SKILL.md          # obligatoire : frontmatter name + description, instructions
  references/       # optionnel : documentation de fond, checklists
  templates/        # optionnel : fichiers modèles à copier/adapter
  scripts/          # optionnel : utilitaires en lecture seule ou dry-run par défaut
```

## Processus

1. Forkez le dépôt et créez une branche descriptive (`skill/nom-du-skill`,
   `fix/description-courte`).
2. Ajoutez des tests (`tests/`) pour toute logique de script non triviale.
3. Vérifiez localement avant de proposer la PR :
   ```bash
   npm install
   npm run lint
   npm run typecheck
   npm run test
   npm run format:check
   ```
4. Ouvrez une pull request décrivant le besoin couvert par le changement, pas seulement le
   changement technique.

## Style de code

- TypeScript strict, pas de `any` implicite.
- Pas de dépendance runtime ajoutée sans justification explicite dans la PR — ce dépôt vise des
  dépendances minimales.
- Formatage via Prettier (`npm run format`), lint via ESLint (`npm run lint`).
