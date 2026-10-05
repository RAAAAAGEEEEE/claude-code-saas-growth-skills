# Dépannage

| Symptôme                                       | Cause probable                   | Piste                                                                                                                                                |
| ---------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Le skill n'apparaît pas dans Claude Code       | Dossier mal placé                | Chemin attendu : `~/.claude/skills/<nom>/SKILL.md` ou `.claude/skills/<nom>/SKILL.md`. Relancez la session. Voir [INSTALLATION.md](INSTALLATION.md). |
| Le skill ne se lance pas quand je le décris    | `disable-model-invocation: true` | Normal : tapez `/<nom>`. Voir [USAGE.md](USAGE.md).                                                                                                  |
| `Cannot find module` sur un fichier de `dist/` | Scripts non compilés             | Lancez `npm run build` (ou `npm test`).                                                                                                              |
| `npm test` échoue                              | Node inférieur à 22              | `package.json` exige Node 22 ou plus.                                                                                                                |
| `npm run format:check` signale des fichiers    | Fins de ligne ou style Prettier  | Constaté le 2026-10-05 sur Windows avec `core.autocrlf=true` (44 fichiers). `npm run format` corrige.                                                |
| Aucun événement envoyé à PostHog               | Clé vide                         | Comportement voulu, voir [CONFIGURATION.md](CONFIGURATION.md).                                                                                       |
