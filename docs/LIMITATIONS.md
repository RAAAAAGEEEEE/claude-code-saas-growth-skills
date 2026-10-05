# Limitations

- Statut : version 0.1.0, premiers skills, peu de retours d'usage ; voir [CHANGELOG.md](../CHANGELOG.md).
- Stack ciblée : TypeScript, Next.js App Router, PostHog. Les autres stacks ne sont pas couvertes.
- Les skills guident Claude ; le résultat dépend du modèle et du projet cible. Rien n'est garanti.
- `saas-funnel-diagnosis` analyse un export CSV agrégé (étape, utilisateurs, période) : il décrit
  des corrélations, pas des causes, et les petits échantillons limitent les conclusions.
- `audit-tracking-config` repose sur des expressions régulières : faux positifs et faux négatifs
  possibles, il ne remplace pas une revue manuelle.
- Le tracking publicitaire ne constitue pas un avis juridique : la conformité (consentement, RGPD)
  reste de la responsabilité du mainteneur du site cible.
- Aucune intégration n'a été testée contre une régie publicitaire réelle : les templates sont en
  dry-run par défaut.
- Les skills sont rédigés en français.
- Les 61 tests couvrent uniquement les scripts, pas le comportement de Claude.
- Aucun tag ni release publié.

Évolutions envisagées, non engagées : [ROADMAP.md](../ROADMAP.md).
