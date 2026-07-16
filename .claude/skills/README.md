# .claude/skills/

Ce dossier est l'emplacement où Claude Code découvre automatiquement les skills d'un projet
(`.claude/skills/<nom>/SKILL.md`).

Dans ce dépôt, la **source de vérité** de chaque skill vit dans [`skills/`](../../skills/) à la
racine, pour rester lisible et versionnée indépendamment de la convention d'activation locale.

## Installer un skill dans votre propre projet

Copiez le dossier du skill souhaité depuis `skills/<nom>/` vers `.claude/skills/<nom>/` dans votre
projet cible :

```bash
cp -r skills/saas-event-instrumentation /chemin/vers/votre-projet/.claude/skills/
```

Claude Code chargera alors `SKILL.md` ainsi que ses sous-dossiers `references/`, `templates/` et
`scripts/` associés.
