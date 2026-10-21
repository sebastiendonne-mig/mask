# mask — seuils et cadrage (lot 0, validés le 21/10/2026)

> Fixés AVANT tout essai. Ils ne bougent plus une fois les mesures lancées ; tout amendement est daté et justifié, avant le run concerné.

## 1. Promesse et limites

- Promesse : repérer et remplacer les données identifiantes d'un document, entièrement dans le navigateur du visiteur. Relecture humaine de chaque remplacement avant usage du texte ailleurs. La table de correspondance reste chez le visiteur.
- L'app ne dit jamais « anonymisé » ni « conforme RGPD ». Pour un document hors des 3 personas : « non évalué sur ce type de document, relisez chaque remplacement ».
- Architecture à valider par la mesure : règles (formats fixes) + modèle (noms, adresses, organisations).
- Contexte : guide déontologique du CNB (mars 2026) sur le secret professionnel et la pseudonymisation avant une IA générative. Limite : pseudonymiser n'est pas anonymiser.

## 2. Périmètre v1

- Entrées : n'importe quel document déposé + 3 personas en démo.
- Formats v1 : texte collé, .txt, .docx, PDF contenant du texte. Exclus et signalés : PDF scannés, images, photos.
- Le fichier ne quitte jamais le navigateur ; vocabulaire de l'interface : « déposer », jamais « uploader ».
- Expérience progressive : règles immédiates, modèle téléchargé en arrière-plan (taille annoncée, barre de progression), puis « compléter la détection » ; cache aux visites suivantes.
- Repli (navigateur incompatible, mobile, modèle non chargé) : vidéo + résultats d'évaluation + mode « règles seules » clairement présenté comme partiel. Repli mobile : décision après les mesures du lot 1.

## 3. Personas et identifiants

| Persona | Document type | Identifiants masqués |
|---|---|---|
| Avocat | Courrier client, assignation | Noms des parties, adresses, organisations, n° de dossier |
| Expert-comptable | Lettre de mission, relevé | Raison sociale, SIREN/SIRET, n° TVA intracommunautaire, IBAN, dirigeant, adresse, e-mail, téléphone |
| RH | Contrat de travail, attestation | Nom, n° de sécurité sociale, adresse, e-mail, téléphone |

Décisions :
- a) Montants (salaire, honoraires) : NON masqués en v1 — limite affichée.
- b) Santé en texte libre (« en arrêt maladie depuis… ») : hors v1 — limite affichée.
- c) Dates : AUCUNE date masquée, y compris les dates de naissance — limite affichée (une date de naissance combinée à d'autres éléments peut permettre une réidentification). Les dates restent dans le golden set : une date masquée compte comme faux positif.
- Point à trancher au lot 1, après mesure : lieux isolés (une ville seule, hors adresse).

## 4. Seuils go/no-go

| # | Critère | Seuil | Bloquant |
|---|---|---|---|
| S1 | Aucune requête réseau contenant du texte du document, aucune télémétrie de contenu (analytics, suivi d'erreurs, journaux) | 0 | Oui |
| S2 | Rappel sur les formats fixes (IBAN, SIREN/SIRET, n° de sécurité sociale, e-mail, téléphone, carte bancaire) | 100 % | Oui |
| S3 | Rappel sur les noms de personnes | ≥ 95 % | Oui |
| S4 | Rappel sur les adresses | ≥ 90 % | Oui |
| S5 | Rappel sur les organisations | ≥ 85 % | Non, affiché |
| S6 | Précision globale | ≥ 80 % | Non, affiché |
| S7 | Chargement : règles < 1 s ; modèle prêt ≤ 30 s à la 1re visite (débit simulé de référence : 100 Mb/s) ; ≤ 5 s aux visites suivantes | — | Oui |
| S8 | Temps de traitement par page | calibré au lot 1, aucun chiffre fixé d'avance | — |
| S9 | Licence compatible avec un usage commercial, provenance officielle, révision épinglée, empreinte vérifiée | — | Oui |

Note : S3 (95 %) est un choix assumé, sans norme externe ; il se justifie par la relecture humaine obligatoire.

## 5. Golden set (sans annotation manuelle)

- 3 personas × 10 documents + 5 documents sans aucune donnée personnelle (faux positifs).
- Génération : modèles de documents rédigés une fois, emplacements remplis par script avec des données fictives (formats et clés de contrôle valides, valeurs inventées) ; étiquettes connues dès la génération. Jamais de données réelles.
- Pièges : prénoms-mots courants (Rose, Pierre), noms de personne = noms de ville (Florence), MAJUSCULES, adresse sur deux lignes, entreprise portant un nom de famille, identifiants dans un tableau .docx, texte PDF coupé en fin de ligne, dates nombreuses (ne doivent pas être masquées).
- Limite assumée : données 100 % synthétiques, plus propres que des documents réels.

## 6. Candidats du lot 1

| Candidat | Type | Licence | Taille | Réserve |
|---|---|---|---|---|
| Règles | Expressions régulières + clés de contrôle | — | ~0 | Référence de base ; ne voit ni noms ni adresses |
| cmarkea/distilcamembert-base-ner | Détection d'entités, français | MIT | à mesurer | PER/LOC/ORG/MISC seulement ; entraîné sur WikiNER (chiffres publiés probablement optimistes sur des courriers) |
| Jean-Baptiste/camembert-ner (port Transformers.js non officiel) | Détection d'entités, français | à vérifier | ~110 M paramètres | Licence et port à vérifier |
| ZenSystemAI/ossredact-pii-base | Données personnelles, 20 types | MIT | ~277 Mo (int8) | Entraînement 100 % synthétique québécois ; formats canadiens, pas SIRET ni n° de sécurité sociale français |
| Petit LLM 1–3 B (WebLLM) | Génératif, challenger | selon modèle | > 1 Go probablement | Ne passera probablement pas S7 dans le navigateur ; mesure si le gain de qualité vaudrait l'attente |

Règle de mesure : même bibliothèque que l'app (Transformers.js), pour que les mesures locales prédisent le comportement réel.

## 7. À vérifier en début de lot 1

- Taille réelle et compatibilité navigateur des deux modèles CamemBERT ; licence de camembert-ner.
- En-têtes de sécurité éventuellement imposés par WebGPU et effet sur les analytics.
- Bibliothèques de lecture .docx et PDF dans le navigateur.
- Licence du dépôt public (décision en attente).
