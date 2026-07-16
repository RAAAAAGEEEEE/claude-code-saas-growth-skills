# Checklist des causes fréquentes d'abandon de funnel

Utiliser cette liste comme point de départ pour formuler des hypothèses, jamais comme diagnostic
automatique — chaque item doit être vérifié avec les données réelles avant d'être retenu.

- **Friction UX** : formulaire trop long, champ obligatoire non évident, absence de feedback visuel.
- **Latence technique** : appel API lent ou en échec silencieux à cette étape précise.
- **Mauvais ciblage** : le trafic arrivant à cette étape ne correspond pas au segment attendu
  (vérifier la source d'acquisition).
- **Rupture de confiance** : demande d'information sensible (carte bancaire, téléphone) trop tôt
  dans le parcours.
- **Problème d'instrumentation** : l'événement de l'étape suivante existe mais n'est pas envoyé
  correctement (vérifier avant de conclure à un vrai abandon utilisateur).
- **Device/navigateur** : l'abandon est concentré sur un device ou navigateur spécifique (bug
  d'affichage ou de compatibilité).
