# Checklist de déduplication client/serveur

- [ ] Le pixel client et l'appel server-side utilisent le **même `event_id`** pour le même
      événement de conversion.
- [ ] L'`event_id` est généré une seule fois (côté serveur, avant que le client ne déclenche le
      pixel) puis transmis au client via la réponse de la page ou de l'API.
- [ ] Les données personnelles (email, téléphone) sont hashées en SHA-256 après normalisation
      (minuscules, suppression des espaces) avant tout envoi.
- [ ] Aucun pixel ID, access token, ou identifiant de compte publicitaire réel n'est présent dans
      le code source commité — uniquement des références à des variables d'environnement.
- [ ] Le mode dry-run est actif par défaut en développement et en CI ; le passage en envoi réel est
      une action explicite et confirmée, jamais le comportement par défaut.
- [ ] Un même événement de conversion n'est envoyé qu'une seule fois côté serveur (idempotence
      vérifiée, ex: verrou sur `event_id` déjà traité).
