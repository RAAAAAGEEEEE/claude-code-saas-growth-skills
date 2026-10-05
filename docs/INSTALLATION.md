# Installation

Prérequis : [Claude Code](https://docs.claude.com/en/docs/claude-code) et `git`. Node.js 22 ou
plus (`engines` de `package.json`) n'est nécessaire que pour compiler et tester les scripts, pas
pour utiliser les skills.

Claude Code charge un skill depuis un dossier contenant un `SKILL.md`, placé dans
`~/.claude/skills/<nom>/` (personnel, tous vos projets) ou `.claude/skills/<nom>/` (un seul
projet). On ne colle jamais le dépôt dans la conversation.

## 1. Cloner le dépôt

```bash
git clone https://github.com/RAAAAAGEEEEE/claude-code-saas-growth-skills
cd claude-code-saas-growth-skills
```

## 2. Copier les trois skills

Installation personnelle (macOS, Linux, Git Bash) :

```bash
mkdir -p ~/.claude/skills
cp -r skills/ads-conversion-tracking skills/saas-event-instrumentation skills/saas-funnel-diagnosis ~/.claude/skills/
```

Installation dans un projet (remplacez `/chemin/vers/votre-projet`) :

```bash
mkdir -p /chemin/vers/votre-projet/.claude/skills
cp -r skills/ads-conversion-tracking skills/saas-event-instrumentation skills/saas-funnel-diagnosis /chemin/vers/votre-projet/.claude/skills/
```

Windows PowerShell, installation personnelle :

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills" | Out-Null
Copy-Item -Recurse -Force skills\ads-conversion-tracking, skills\saas-event-instrumentation, skills\saas-funnel-diagnosis "$HOME\.claude\skills"
```

Pour ne copier qu'un skill, ne gardez que son dossier dans la commande. Après une mise à jour du
dépôt (`git pull`), recopiez les dossiers.

## 3. Vérifier

```bash
ls ~/.claude/skills/*/SKILL.md
```

Trois lignes doivent s'afficher. Dans Claude Code, tapez `/` : les trois noms sont proposés
(`/saas-event-instrumentation`, `/saas-funnel-diagnosis`, `/ads-conversion-tracking`). Voir
[USAGE.md](USAGE.md) pour la suite.

## Développement local (scripts et tests)

```bash
npm ci
npm test
```

`npm test` compile le TypeScript vers `dist/` puis lance les tests `node:test` (61 tests le
2026-10-05). `npm run lint` et `npm run typecheck` sont aussi disponibles. En cas de souci, voir
[TROUBLESHOOTING.md](TROUBLESHOOTING.md).
