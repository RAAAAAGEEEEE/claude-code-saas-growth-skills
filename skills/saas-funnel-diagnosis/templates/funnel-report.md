# Rapport de diagnostic de funnel — {{nom_du_funnel}}

Période analysée : {{periode}} — généré à partir de {{source_donnees}} (export agrégé, lecture
seule, aucune donnée individuelle).

## Résumé exécutif

{{resume_2_a_3_phrases}} — chiffres clés uniquement, aucune conclusion causale à ce stade.

## Tableau des étapes

| Étape       | Utilisateurs | Conversion depuis l'étape précédente | Abandon                |
| ----------- | ------------ | ------------------------------------ | ---------------------- |
| {{etape_1}} | {{n1}}       | —                                    | —                      |
| {{etape_2}} | {{n2}}       | {{taux_conversion_1_2}} %            | {{taux_abandon_1_2}} % |
| {{etape_3}} | {{n3}}       | {{taux_conversion_2_3}} %            | {{taux_abandon_2_3}} % |

## Goulot principal

**{{etape_goulot}}** — taux d'abandon de {{taux_abandon_goulot}} % depuis l'étape précédente.

{{note_si_plusieurs_etapes_proches}}

## Hypothèses classées ICE

Impact, Confiance, Effort notés de 1 (faible) à 5 (fort) ; score = Impact × Confiance / Effort.
Aucune hypothèse n'est présentée comme confirmée — toutes restent à vérifier.

| Hypothèse       | Impact | Confiance | Effort | Score  | Vérification proposée |
| --------------- | ------ | --------- | ------ | ------ | --------------------- |
| {{hypothese_1}} | {{i1}} | {{c1}}    | {{e1}} | {{s1}} | {{verification_1}}    |
| {{hypothese_2}} | {{i2}} | {{c2}}    | {{e2}} | {{s2}} | {{verification_2}}    |
| {{hypothese_3}} | {{i3}} | {{c3}}    | {{e3}} | {{s3}} | {{verification_3}}    |

## Événements à ajouter

- {{evenement_propose_1}} (`{{trigger_1}}`) — comble le manque de visibilité sur
  {{raison_1}}. Vérifié : ne duplique pas d'événement existant listé dans les données fournies.
- {{evenement_propose_2}} (`{{trigger_2}}`) — {{raison_2}}.

## Risques et limites

- Corrélation observée sur les données fournies, pas de preuve de causalité.
- Taille d'échantillon : {{taille_echantillon}} — {{note_fiabilite_statistique}}.
- {{autre_limite_specifique}}
- Aucune recommandation de ce rapport ne repose sur un dark pattern (friction artificielle,
  culpabilisation, fausse urgence, case pré-cochée).

## Prochaine action unique recommandée

{{action_unique}} — une seule action priorisée, pas une liste. Aucune correction produit n'est
appliquée avant que cette action de vérification n'ait confirmé ou infirmé l'hypothèse retenue.
