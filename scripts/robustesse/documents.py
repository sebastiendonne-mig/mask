# Jeu de robustesse de mask — 15 documents rédigés à la main (Claude, 22/10/2026),
# indépendamment du générateur (scripts/generate-golden.mjs).
#
# Chaque étiquette : (TYPE, texte) → toutes les occurrences (bornées par des mots)
#                    (TYPE, texte, contexte) → le texte pris à l'intérieur de chaque
#                    occurrence du contexte (pour lever une ambiguïté : Nancy prénom / Nancy ville).
# Une occurrence contenue dans une étiquette plus longue est absorbée par elle
# (règle « l'étiquette englobante l'emporte » de golden/README.md).

# Mots identiques à un nom de personne du même document, laissés volontairement sans
# étiquette (pièges de précision) : construire.py les signale au lieu d'échouer.
VOULUS = [
    ("rob-avocat-02", "Noël"),        # « les congés de Noël »
    ("rob-rh-04", "constance"),       # « fait preuve de constance »
    ("rob-rh-04", "petit"),           # « un petit retard »
]

NNBSP = "\u202f"  # espace fine insécable (typographie Word)

DOCS = []

def doc(doc_id, persona, modele, texte, etiquettes):
    DOCS.append(dict(doc_id=doc_id, persona=persona, modele=modele, texte=texte, etiquettes=etiquettes))

# ---------------------------------------------------------------- AVOCAT

doc("rob-avocat-01", "avocat", "rob-fil-de-courriels", """\
De : Lucas Laval <l.laval@laval-avocats.fr>
Envoyé : jeudi 9 avril 2026 14:32
À : nancy.fournier@mailo-perso.fr
Objet : RE: votre dossier prud'homal — RG 26/00418

Bonjour Nancy,

Suite à notre échange de ce matin, je vous confirme que l'audience de conciliation devant le conseil de prud'hommes de Nancy est fixée au 12 mai à 9 h 30. Votre ancien employeur, les Transports Ferrand, sera représenté par son avocat habituel, Me Aurélien Teissier.

Merci de m'apporter avant la fin du mois vos trois derniers bulletins de paie et le courrier de licenciement daté du 2 mars. Si vous avez gardé les échanges avec Damien (votre chef d'équipe), ils nous seront utiles.

Bien à vous,
Lucas

Lucas Laval
Avocat au barreau de Nancy
3 bis, cours des Tilleuls, 54000 Nancy
06 39 98 27 14

-----Message d'origine-----
De : nancy fournier <nancy.fournier@mailo-perso.fr>
Envoyé : mercredi 8 avril 2026 22:05
À : l.laval@laval-avocats.fr
Objet : votre dossier prud'homal

Bonsoir Maître,
Je vous transmets la convocation. Je pourrai passer à votre cabinet lundi en fin de journée, je travaille maintenant à Lunéville.
Cordialement
nancy fournier
""", [
    ("PERSONNE", "Lucas Laval"), ("PERSONNE", "Lucas"),
    ("PERSONNE", "Nancy", "Bonjour Nancy,"), ("PERSONNE", "nancy fournier"),
    ("PERSONNE", "Aurélien Teissier"), ("PERSONNE", "Damien"),
    ("EMAIL", "l.laval@laval-avocats.fr"), ("EMAIL", "nancy.fournier@mailo-perso.fr"),
    ("ORGANISATION", "Transports Ferrand"),
    ("NUMERO_DOSSIER", "26/00418"),
    ("ADRESSE", "3 bis, cours des Tilleuls, 54000 Nancy"),
    ("TELEPHONE", "06 39 98 27 14"),
    ("DATE", "jeudi 9 avril 2026"), ("DATE", "mercredi 8 avril 2026"), ("DATE", "12 mai"), ("DATE", "2 mars"),
    ("INSTITUTION", "conseil de prud'hommes"), ("INSTITUTION", "barreau"),
    ("LIEU_ISOLE", "Nancy", "prud'hommes de Nancy"), ("LIEU_ISOLE", "Nancy", "barreau de Nancy"),
    ("LIEU_ISOLE", "Lunéville"),
])

doc("rob-avocat-02", "avocat", "rob-assignation-parties", """\
ASSIGNATION DEVANT LE TRIBUNAL JUDICIAIRE DE TOULON

À LA REQUÊTE DE :

La société Kervala, société par actions simplifiée au capital de 10 000 euros, immatriculée au registre du commerce et des sociétés de Toulon sous le numéro 812.345.676, dont le siège social est situé parc d'activités des Gabrielles, lot 14, 83500 La Seyne-sur-Mer, prise en la personne de son président en exercice, Monsieur Erwan Kerhervé, domicilié en cette qualité audit siège,

Ayant pour avocat Maître Clémence Aubry-Sanchez, avocate au barreau de Toulon, demeurant 27 boulevard de Strasbourg — 83000 Toulon,

CONTRE :

Monsieur Noël Garnier-Vidal, né le 25 décembre 1979 à Valence, de nationalité française, artisan plombier exerçant sous l'enseigne « Plomberie du Faron », demeurant lieu-dit Les Bastidons, chemin des Oliviers, 83330 Le Castellet,

ci-après « M. Garnier-Vidal » ou « le défendeur ».

PLAISE AU TRIBUNAL

Par devis du 3 février 2025, la société Kervala a commandé à M. Garnier-Vidal la reprise complète des réseaux d'eau de son atelier, pour un prix de 18 400 € HT. Les travaux, qui devaient être livrés avant les congés de Noël, ont été abandonnés en l'état le 19 décembre 2025. Malgré une relation commerciale jusqu'alors constante, le défendeur n'a donné aucune suite aux relances de la requérante.
""", [
    ("ORGANISATION", "Kervala"), ("ORGANISATION", "Plomberie du Faron"),
    ("SIREN", "812.345.676"),
    ("ADRESSE", "parc d'activités des Gabrielles, lot 14, 83500 La Seyne-sur-Mer"),
    ("ADRESSE", "27 boulevard de Strasbourg — 83000 Toulon"),
    ("ADRESSE", "lieu-dit Les Bastidons, chemin des Oliviers, 83330 Le Castellet"),
    ("PERSONNE", "Erwan Kerhervé"), ("PERSONNE", "Clémence Aubry-Sanchez"),
    ("PERSONNE", "Noël Garnier-Vidal"), ("PERSONNE", "Garnier-Vidal"),
    ("DATE", "25 décembre 1979"), ("DATE", "3 février 2025"), ("DATE", "19 décembre 2025"),
    ("MONTANT", "10 000 euros"), ("MONTANT", "18 400 €"),
    ("INSTITUTION", "TRIBUNAL JUDICIAIRE"), ("INSTITUTION", "TRIBUNAL"),
    ("INSTITUTION", "registre du commerce et des sociétés"), ("INSTITUTION", "barreau"),
    ("LIEU_ISOLE", "TOULON"), ("LIEU_ISOLE", "Toulon"), ("LIEU_ISOLE", "Valence"),
])

doc("rob-avocat-03", "avocat", "rob-notes-rendez-vous", """\
CR rdv 14/04 — dossier BONNET c/ Assur'Azur (réf. cab. 26-0412-OB)

Présents : Olive Bonnet (cliente), son fils Ange, moi.

- Mme Bonnet tient la pharmacie depuis 2011 à Sanary (enseigne : Pharmacie Bonnet & Fils). Sinistre dégât des eaux du 2 janvier : l'assureur Assur'Azur refuse la prise en charge au motif d'un défaut d'entretien.
- Elle conteste aussi deux prélèvements faits sur sa carte pro n° 3782 916305 74126 les 6 et 7 janvier (387,20 € et 1 150,00 €), qu'elle n'a pas autorisés.
- Ange gère maintenant la compta ; à contacter directement : ange.bonnet.pro@officinemail.fr — mais préférer le fixe de l'officine, 04 65 71 38 02.
- Courriers de l'assureur adressés à : Assur'Azur, service sinistres, BP 207, 06002 Nice Cedex 1.
- Expert mandaté côté assureur : un certain Thibault, cabinet Expertis Sud (nom complet à retrouver dans le rapport).

À faire : demander le rapport d'expertise ; lettre à l'assureur avant le 30.
""", [
    ("PERSONNE", "BONNET"), ("PERSONNE", "Olive Bonnet"), ("PERSONNE", "Bonnet"),
    ("PERSONNE", "Ange"), ("PERSONNE", "Thibault"),
    ("ORGANISATION", "Assur'Azur"), ("ORGANISATION", "Pharmacie Bonnet & Fils"), ("ORGANISATION", "Expertis Sud"),
    ("NUMERO_DOSSIER", "26-0412-OB"),
    ("CARTE", "3782 916305 74126"),
    ("EMAIL", "ange.bonnet.pro@officinemail.fr"),
    ("TELEPHONE", "04 65 71 38 02"),
    ("ADRESSE", "BP 207, 06002 Nice Cedex 1"),
    ("DATE", "14/04"), ("DATE", "2011"), ("DATE", "2 janvier"), ("DATE", "6 et 7 janvier"), ("DATE", "30", "avant le 30"),
    ("MONTANT", "387,20 €"), ("MONTANT", "1 150,00 €"),
    ("LIEU_ISOLE", "Sanary"),
])

doc("rob-avocat-04", "avocat", "rob-lettre-confrere", """\
Maître Hélène de Villeneuve-Rocca
Avocate à la Cour
Résidence Le Clos Fleuri — Bât. B, appt 14
112, avenue du Docteur-Fontan
06110 LE CANNET
Tél. 0033 4 65 71 90 26 — h.devilleneuve@avocats-cannet.eu

Maître Romain Chabert
Cabinet Chabert
9, rue des Remparts
84000 Avignon

Le Cannet, le 27 avril 2026

Affaire : Constant c/ Banque Méridienne
V/Réf. : RC/2026/118 — N/Réf. : HVR-0388

Mon cher confrère,

Je fais suite à notre entretien téléphonique. Mes clients, Bertrand et Agathe Constant, maintiennent leur position : la Banque Méridienne a débloqué les fonds du prêt sans vérifier l'avancement du chantier, contrairement à une pratique constante en la matière.

Je vous rappelle que les époux Constant ont adressé deux réclamations écrites à l'agence de Cavaillon, restées sans réponse, et que M. Constant a saisi le médiateur bancaire le 15 mars.

Je vous propose une réunion à mon cabinet ou, si vous le préférez, à Avignon. Ma collaboratrice, Mlle Inès Saïdi, se tient à votre disposition pour fixer une date.

Bien confraternellement,

H. de Villeneuve-Rocca
""", [
    ("PERSONNE", "Hélène de Villeneuve-Rocca"), ("PERSONNE", "H. de Villeneuve-Rocca"),
    ("PERSONNE", "Romain Chabert"), ("PERSONNE", "Bertrand"), ("PERSONNE", "Agathe Constant"),
    ("PERSONNE", "Constant"), ("PERSONNE", "Inès Saïdi"),
    ("ORGANISATION", "Cabinet Chabert"), ("ORGANISATION", "Banque Méridienne"),
    ("ADRESSE", "Résidence Le Clos Fleuri — Bât. B, appt 14\n112, avenue du Docteur-Fontan\n06110 LE CANNET"),
    ("ADRESSE", "9, rue des Remparts\n84000 Avignon"),
    ("TELEPHONE", "0033 4 65 71 90 26"), ("EMAIL", "h.devilleneuve@avocats-cannet.eu"),
    ("NUMERO_DOSSIER", "RC/2026/118"), ("NUMERO_DOSSIER", "HVR-0388"),
    ("DATE", "27 avril 2026"), ("DATE", "15 mars"),
    ("LIEU_ISOLE", "Le Cannet"), ("LIEU_ISOLE", "Cavaillon"), ("LIEU_ISOLE", "Avignon", "à Avignon"),
])

doc("rob-avocat-05", "avocat", "rob-attestation-temoin", f"""\
ATTESTATION
(articles 200 à 203 du code de procédure civile)

Nom{NNBSP}: N’DIAYE
Prénoms{NNBSP}: Aminata Fatou
Date et lieu de naissance{NNBSP}: 04/11/1990 à Dakar (Sénégal)
Adresse{NNBSP}: 5 impasse des Glycines, appartement 3, 13090 Aix-en-Provence
Profession{NNBSP}: aide-soignante
Lien avec les parties{NNBSP}: voisine de M. Le Goff, sans lien de parenté ni de subordination

Je sais que la présente attestation est destinée à être produite en justice et qu’une fausse attestation m’expose à des sanctions pénales.

Je soussignée aminata n’diaye atteste avoir vu, le samedi 7 février 2026 vers 18 h, monsieur yann le goff sortir de son garage avec un carton marqué «{NNBSP}Atelier Le Goff{NNBSP}». Il m’a dit qu’il vidait le local avant l’arrivée du repreneur, un dénommé Marchal. Je connais Yann depuis que je me suis installée dans l’impasse, en 2019.

Fait à Aix-en-Provence, le 12 mars 2026.

Signature{NNBSP}: A. N’Diaye
""", [
    ("PERSONNE", "N’DIAYE"), ("PERSONNE", "Aminata Fatou"), ("PERSONNE", "aminata n’diaye"),
    ("PERSONNE", "A. N’Diaye"), ("PERSONNE", "Le Goff"), ("PERSONNE", "yann le goff"),
    ("PERSONNE", "Marchal"), ("PERSONNE", "Yann"),
    ("ORGANISATION", "Atelier Le Goff"),
    ("ADRESSE", "5 impasse des Glycines, appartement 3, 13090 Aix-en-Provence"),
    ("DATE", "04/11/1990"), ("DATE", "samedi 7 février 2026"), ("DATE", "2019"), ("DATE", "12 mars 2026"),
    ("LIEU_ISOLE", "Dakar"), ("LIEU_ISOLE", "Aix-en-Provence", "Fait à Aix-en-Provence"),
])

# ---------------------------------------------------------- EXPERT-COMPTABLE

doc("rob-ec-01", "expert-comptable", "rob-fiche-client-tableau", """\
FICHE CLIENT — mise à jour du 02.03.2026

Rubrique\tValeur
Dénomination\tAtelier Lumière & Bois
Forme\tSARL
SIREN\t904 182 532
SIRET (siège)\t904 182 532 00021
N° TVA\tFR 32 904182532
Code NAF\t1629Z
Gérante\tFABRE Mathilde
Co-gérant\tHaddad, Karim
Siège\t41 rue de la Verrerie, 30700 Uzès
Banque principale\tBE12 7310 4126 5892 (compte belge)
Mail facturation\tCompta.AtelierLumiere@lumiere-bois.fr
Tél.\t+33 4 65 71 55 60
Capital\t7 500 €
Clôture exercice\t30 juin
Date de création\t15/09/2021

Observations : Mme Fabre souhaite passer à une clôture au 31 décembre à compter de l'exercice 2027. Son associé, M. Haddad, est d'accord. Dossier comptable n° 2021-0457.
""", [
    ("ORGANISATION", "Atelier Lumière & Bois"),
    ("SIREN", "904 182 532"), ("SIRET", "904 182 532 00021"), ("TVA_INTRA", "FR 32 904182532"),
    ("PERSONNE", "FABRE Mathilde"), ("PERSONNE", "Haddad, Karim"), ("PERSONNE", "Fabre"), ("PERSONNE", "Haddad"),
    ("ADRESSE", "41 rue de la Verrerie, 30700 Uzès"),
    ("IBAN", "BE12 7310 4126 5892"),
    ("EMAIL", "Compta.AtelierLumiere@lumiere-bois.fr"),
    ("TELEPHONE", "+33 4 65 71 55 60"),
    ("MONTANT", "7 500 €"),
    ("DATE", "02.03.2026"), ("DATE", "30 juin"), ("DATE", "15/09/2021"), ("DATE", "31 décembre"), ("DATE", "2027"),
    ("NUMERO_DOSSIER", "2021-0457"),
])

doc("rob-ec-02", "expert-comptable", "rob-courriel-pieces", """\
Objet : Pièces manquantes pour le bilan — Boulangerie Au Bon Grain

Bonjour Mathieu,

J'espère que la reprise s'est bien passée après les vacances. Pour boucler le bilan, il me manque encore :
- le relevé de décembre du compte pro (celui ouvert à la Caisse Solidaire du Littoral) ;
- les factures de farine de Moulins Reynaud pour le dernier trimestre ;
- l'attestation de votre associée, Célia, pour son apport en compte courant (4 000 €).

Vous pouvez tout déposer sur le portail ou l'envoyer à pieces+bongrain@cabinet-orsatti.fr, l'adresse est triée automatiquement.

Petite précision : le chèque de 1 280 € encaissé le 18/12 provient bien de M. Aubanel (traiteur, rue Paradis, Marseille) ? Je n'ai pas trouvé de facture correspondante.

Je suis au cabinet tous les jours sauf le mercredi, ligne directe 04 65 71 23 45, poste 12.

Bonne journée,
Karine Orsatti
Cabinet Orsatti — expertise comptable
""", [
    ("ORGANISATION", "Boulangerie Au Bon Grain"), ("ORGANISATION", "Caisse Solidaire du Littoral"),
    ("ORGANISATION", "Moulins Reynaud"), ("ORGANISATION", "Cabinet Orsatti"),
    ("PERSONNE", "Mathieu"), ("PERSONNE", "Célia"), ("PERSONNE", "Aubanel"), ("PERSONNE", "Karine Orsatti"),
    ("EMAIL", "pieces+bongrain@cabinet-orsatti.fr"),
    ("ADRESSE", "rue Paradis, Marseille"),
    ("TELEPHONE", "04 65 71 23 45"),
    ("MONTANT", "4 000 €"), ("MONTANT", "1 280 €"),
    ("DATE", "décembre"), ("DATE", "18/12"),
])

doc("rob-ec-03", "expert-comptable", "rob-lettre-mission-association", """\
LETTRE DE MISSION — PRÉSENTATION DES COMPTES ANNUELS

Entre les soussignés :

Audit Provence Conseil, société d'expertise comptable inscrite au tableau de l'Ordre des experts-comptables, SIREN 883401291, TVA FR52883401291, représentée par Sylvie Marchetti, expert-comptable associée,

Et :

l'association Les Amis du Vieux Port, association déclarée, SIRET 842 770 166 00010, dont le siège est fixé 2 traverse des Pêcheurs, 13002 Marseille, représentée par son trésorier, Jean-Baptiste Roux, dûment habilité par décision du bureau du 14 janvier 2026.

Article 4 — Honoraires
Les honoraires sont fixés forfaitairement à 1 850 euros hors taxes par exercice, payables par prélèvement sur le compte de l'association ouvert à la Caisse Solidaire du Littoral :
FR76 1660 7003 2108 7654
3210 957

Article 7 — Interlocuteurs
Pour l'association, toute correspondance est adressée au trésorier (tresorerie.amisduvieuxport@assoc-mail.org). Pour le cabinet, l'interlocutrice est Mme Marchetti ou, en son absence, sa collaboratrice Lou Agostini.

Fait en deux exemplaires, à Marseille, le 20 janvier 2026.
""", [
    ("ORGANISATION", "Audit Provence Conseil"), ("ORGANISATION", "Les Amis du Vieux Port"),
    ("ORGANISATION", "Caisse Solidaire du Littoral"),
    ("SIREN", "883401291"), ("TVA_INTRA", "FR52883401291"), ("SIRET", "842 770 166 00010"),
    ("PERSONNE", "Sylvie Marchetti"), ("PERSONNE", "Marchetti"), ("PERSONNE", "Jean-Baptiste Roux"),
    ("PERSONNE", "Lou Agostini"),
    ("ADRESSE", "2 traverse des Pêcheurs, 13002 Marseille"),
    ("IBAN", "FR76 1660 7003 2108 7654\n3210 957"),
    ("EMAIL", "tresorerie.amisduvieuxport@assoc-mail.org"),
    ("MONTANT", "1 850 euros"),
    ("DATE", "14 janvier 2026"), ("DATE", "20 janvier 2026"),
    ("INSTITUTION", "Ordre"),
    ("LIEU_ISOLE", "Marseille", "à Marseille, le"),
])

doc("rob-ec-04", "expert-comptable", "rob-note-cession", """\
Note de synthèse — projet de cession du fonds « Vienne Distribution »

Client : Christophe Vienne, gérant et associé unique de Vienne Distribution (EURL, SIRET 52309874700042, TVA FR86523098747).

Le fonds, exploité à Vienne depuis 2009, comprend un magasin de matériel agricole et un dépôt situé route de Lyon, sans numéro, à côté de la coopérative. M. Vienne envisage de céder l'ensemble à son principal fournisseur, Agri Rhône Équipement, dont le directeur financier, Paul-Henri Dussart, nous a transmis une première offre à 620 000 € le 6 octobre.

Points d'attention :
1. Le bail commercial du magasin arrive à échéance le 31/03/2027 ; la bailleresse, Mme Ginette Valette, n'a pas encore indiqué si elle accepterait la cession du bail.
2. Le prêt contracté auprès de la Banque Allobroge reste dû à hauteur de 84 300 € ; remboursement anticipé à prévoir à la signature.
3. Christophe souhaite conserver le dépôt pour une activité de location de matériel, sous une nouvelle société avec sa fille Lyna.

Contact client : c.vienne@vienne-distribution.fr — 04 65 71 08 83.
""", [
    ("ORGANISATION", "Vienne Distribution"), ("ORGANISATION", "Agri Rhône Équipement"),
    ("ORGANISATION", "Banque Allobroge"),
    ("PERSONNE", "Christophe Vienne"), ("PERSONNE", "Vienne", "M. Vienne"),
    ("PERSONNE", "Paul-Henri Dussart"), ("PERSONNE", "Ginette Valette"), ("PERSONNE", "Christophe"),
    ("PERSONNE", "Lyna"),
    ("SIRET", "52309874700042"), ("TVA_INTRA", "FR86523098747"),
    ("ADRESSE", "route de Lyon"),
    ("MONTANT", "620 000 €"), ("MONTANT", "84 300 €"),
    ("DATE", "2009"), ("DATE", "6 octobre"), ("DATE", "31/03/2027"),
    ("EMAIL", "c.vienne@vienne-distribution.fr"), ("TELEPHONE", "04 65 71 08 83"),
    ("LIEU_ISOLE", "Vienne", "à Vienne depuis"),
])

doc("rob-ec-05", "expert-comptable", "rob-relance-logiciel-majuscules", """\
RELANCE N°2 — PIECES COMPTABLES EN ATTENTE
EDITION DU 05/10/26

CLIENT : SCI LES TILLEULS DU LAC
GERANT : M. DUBREUIL JEAN-MARC
ADRESSE : 18 CHEMIN DU LAC
          74200 THONON LES BAINS
SIREN : 438072159
DOSSIER : 004512

PIECE                           PERIODE      MONTANT
RELEVES BANCAIRES               T3 2026      -
QUITTANCES DE LOYER (LOT 2)     07-09/2026   2 340,00 EUR
TAXE FONCIERE 2026              -            1 912,00 EUR

RIB ENREGISTRE : FR76 1254 8029 9804 5172 6309 829
CONTACT DOSSIER : J.-M. DUBREUIL - 06.39.98.71.20 - JM.DUBREUIL@CHABLAIS-MAIL.FR

SANS RETOUR DE VOTRE PART AVANT LE 20/10/26, LE DOSSIER SERA TRANSMIS A M. PERRET, EXPERT-COMPTABLE SIGNATAIRE.
CABINET ALPES LEMAN EXPERTISE - TOUS DROITS RESERVES
""", [
    ("ORGANISATION", "SCI LES TILLEULS DU LAC"), ("ORGANISATION", "CABINET ALPES LEMAN EXPERTISE"),
    ("PERSONNE", "DUBREUIL JEAN-MARC"), ("PERSONNE", "J.-M. DUBREUIL"), ("PERSONNE", "PERRET"),
    ("ADRESSE", "18 CHEMIN DU LAC\n          74200 THONON LES BAINS"),
    ("SIREN", "438072159"), ("NUMERO_DOSSIER", "004512"),
    ("IBAN", "FR76 1254 8029 9804 5172 6309 829"),
    ("TELEPHONE", "06.39.98.71.20"), ("EMAIL", "JM.DUBREUIL@CHABLAIS-MAIL.FR"),
    ("DATE", "05/10/26"), ("DATE", "T3 2026"), ("DATE", "07-09/2026"), ("DATE", "2026", "FONCIERE 2026"),
    ("DATE", "20/10/26"),
    ("MONTANT", "2 340,00 EUR"), ("MONTANT", "1 912,00 EUR"),
])

# ---------------------------------------------------------------------- RH

doc("rob-rh-01", "rh", "rob-cdd-saisonnier", """\
CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE SAISONNIER

Entre :
Le Domaine des Trois Chênes, exploitation viticole, SIRET 791 153 422 00013, dont le siège est situé 860 route des Vignes, 13310 Saint-Martin-de-Crau, représenté par M. Lionel Abadie, en sa qualité de gérant,
ci-après « l'employeur »,

Et :
M. Julien Orsini, né le 14 mars 1986 à Ajaccio,
numéro de sécurité sociale : 1 86 03 2A 004 118 77,
demeurant Mas de la Cabrière, quartier Saint-Martin, 13310 Saint-Martin-de-Crau,
ci-après « le salarié ».

Article 1 — Objet
M. Orsini est engagé pour la durée des vendanges 2026, du 24 août au 10 octobre 2026, en qualité d'ouvrier viticole. Il travaillera sous l'autorité du chef de culture, Florian Martin.

Article 4 — Rémunération
Le salarié percevra un salaire horaire brut de 12,40 euros. Les heures effectuées le dimanche sont majorées de 25 %.

Article 6 — Coordonnées
Toute correspondance sera adressée au salarié à l'adresse ci-dessus ou par courriel (julien.orsini.2a@courriel-perso.fr). Numéro de téléphone communiqué par le salarié : +33 6 39 98 66 03.

Fait à Saint-Martin-de-Crau, en deux exemplaires, le 18 août 2026.

L'employeur : Lionel Abadie          Le salarié : J. Orsini
""", [
    ("ORGANISATION", "Domaine des Trois Chênes"),
    ("SIRET", "791 153 422 00013"),
    ("ADRESSE", "860 route des Vignes, 13310 Saint-Martin-de-Crau"),
    ("ADRESSE", "Mas de la Cabrière, quartier Saint-Martin, 13310 Saint-Martin-de-Crau"),
    ("PERSONNE", "Lionel Abadie"), ("PERSONNE", "Julien Orsini"), ("PERSONNE", "Orsini", "M. Orsini"),
    ("PERSONNE", "J. Orsini"), ("PERSONNE", "Florian Martin"),
    ("NIR", "1 86 03 2A 004 118 77"),
    ("EMAIL", "julien.orsini.2a@courriel-perso.fr"), ("TELEPHONE", "+33 6 39 98 66 03"),
    ("DATE", "14 mars 1986"), ("DATE", "2026", "vendanges 2026"), ("DATE", "24 août"),
    ("DATE", "10 octobre 2026"), ("DATE", "18 août 2026"),
    ("MONTANT", "12,40 euros"),
    ("LIEU_ISOLE", "Ajaccio"), ("LIEU_ISOLE", "Saint-Martin-de-Crau", "Fait à Saint-Martin-de-Crau"),
])

doc("rob-rh-02", "rh", "rob-courriel-arrivee", """\
De : Salomé Rey (RH)
À : Équipe logistique
Cc : Mohamed Benali ; jo.perrin@logisud-transports.fr
Objet : Arrivée de Thi Lan lundi

Bonjour à tous,

Nous accueillons lundi 2 novembre Nguyen Thi Lan, qui rejoint l'équipe logistique en tant que gestionnaire des flux. Thi Lan arrive de chez Frigo Express, où elle a passé six ans sur le site de Rungis.

Son manager sera Mohamed ; pour sa première semaine, c'est Jo qui l'accompagnera sur les outils (WMS, portail transporteurs). Merci de lui réserver un bon accueil !

Quelques informations pratiques :
- son badge sera prêt au poste de garde dès 7 h ;
- sa ligne directe : 03 53 01 47 19 ;
- son adresse : tl.nguyen@logisud-transports.fr.

Pour toute question administrative (mutuelle, tickets restaurant), vous pouvez m'écrire ou passer me voir au bureau 2.14.

Salomé
Ressources humaines — LogiSud Transports
""", [
    ("PERSONNE", "Salomé Rey"), ("PERSONNE", "Salomé"), ("PERSONNE", "Mohamed Benali"),
    ("PERSONNE", "Mohamed"), ("PERSONNE", "Nguyen Thi Lan"), ("PERSONNE", "Thi Lan"), ("PERSONNE", "Jo"),
    ("EMAIL", "jo.perrin@logisud-transports.fr"), ("EMAIL", "tl.nguyen@logisud-transports.fr"),
    ("ORGANISATION", "Frigo Express"), ("ORGANISATION", "LogiSud Transports"),
    ("TELEPHONE", "03 53 01 47 19"),
    ("DATE", "lundi 2 novembre"),
    ("LIEU_ISOLE", "Rungis"),
])

doc("rob-rh-03", "rh", "rob-attestation-employeur", """\
ATTESTATION EMPLOYEUR DESTINÉE À FRANCE TRAVAIL

1. Employeur
Raison sociale : Clinique vétérinaire des Calanques
Adresse : 7 avenue de la Mer – CS 40021 – 13600 La Ciotat
SIRET : 512 948 308 00022

2. Salarié(e)
Nom de naissance : BEN SALEM
Nom d'usage : CARDONA
Prénom(s) : Yasmine
N° de sécurité sociale : 2 91 07 99 351 048 / 53
Date de naissance : 22/07/1991
Adresse : chez M. et Mme Cardona, 3 montée des Pins, 13600 La Ciotat

3. Emploi
Emploi occupé : auxiliaire spécialisée vétérinaire
Date d'entrée : 01/09/2019 — Date de fin de contrat : 30/09/2026
Motif de la rupture : démission
Salaire brut des 12 derniers mois : 26 412,00 €

4. Signataire
Nom et qualité : Dr Arnaud Lefèvre-Blanc, vétérinaire associé
Téléphone : 04-65-71-30-30
Courriel : direction@clinique-calanques.vet

Fait à La Ciotat, le 2 octobre 2026.
""", [
    ("INSTITUTION", "FRANCE TRAVAIL"),
    ("ORGANISATION", "Clinique vétérinaire des Calanques"),
    ("ADRESSE", "7 avenue de la Mer – CS 40021 – 13600 La Ciotat"),
    ("ADRESSE", "3 montée des Pins, 13600 La Ciotat"),
    ("SIRET", "512 948 308 00022"),
    ("PERSONNE", "BEN SALEM"), ("PERSONNE", "CARDONA"), ("PERSONNE", "Yasmine"), ("PERSONNE", "Cardona"),
    ("PERSONNE", "Arnaud Lefèvre-Blanc"),
    ("NIR", "2 91 07 99 351 048 / 53"),
    ("DATE", "22/07/1991"), ("DATE", "01/09/2019"), ("DATE", "30/09/2026"), ("DATE", "2 octobre 2026"),
    ("MONTANT", "26 412,00 €"),
    ("TELEPHONE", "04-65-71-30-30"), ("EMAIL", "direction@clinique-calanques.vet"),
    ("LIEU_ISOLE", "La Ciotat", "Fait à La Ciotat"),
])

doc("rob-rh-04", "rh", "rob-entretien-annuel", """\
COMPTE RENDU D'ENTRETIEN ANNUEL — 2026

Collaboratrice : Constance Morvan — Assistante qualité
Manager : Grégoire Petit — Responsable Qualité & Environnement
Date de l'entretien : 15 septembre 2026

1. Bilan de l'année
Constance a fait preuve de constance et de rigueur sur le suivi des non-conformités. Elle a piloté seule l'audit fournisseur chez Plastiques Durance, avec un petit retard sur le planning initial, rattrapé en juin. Son binôme, Ophélie, souligne sa disponibilité.

2. Objectifs 2027
- Obtenir la certification d'auditrice interne (formation prévue à Avignon, organisme Qualiform).
- Reprendre le suivi du client Montagnier Packaging, jusqu'ici géré par M. Petit.

3. Souhaits de la collaboratrice
Mme Morvan souhaiterait passer à 80 % à partir de janvier, le mercredi. M. Petit y est favorable, sous réserve de l'accord de la direction (Mme Aurore Delmas, DRH).

Signatures : C. Morvan / G. Petit
""", [
    ("PERSONNE", "Constance Morvan"), ("PERSONNE", "Constance"), ("PERSONNE", "Grégoire Petit"),
    ("PERSONNE", "Petit"), ("PERSONNE", "G. Petit"), ("PERSONNE", "Ophélie"), ("PERSONNE", "Morvan"),
    ("PERSONNE", "C. Morvan"), ("PERSONNE", "Aurore Delmas"),
    ("ORGANISATION", "Plastiques Durance"), ("ORGANISATION", "Qualiform"), ("ORGANISATION", "Montagnier Packaging"),
    ("DATE", "2026"), ("DATE", "15 septembre 2026"), ("DATE", "juin"), ("DATE", "2027"), ("DATE", "janvier"),
    ("LIEU_ISOLE", "Avignon"),
])

doc("rob-rh-05", "rh", "rob-convocation-entretien", """\
LETTRE RECOMMANDÉE AVEC AR — REMISE EN MAIN PROPRE CONTRE DÉCHARGE

Monsieur Valentin Lourdes
chez Mme Paule Lourdes
Les Hauts de Saint-Jean, bâtiment 4
83170 BRIGNOLES

Objet : convocation à un entretien préalable

Monsieur,

Nous envisageons à votre égard une mesure de licenciement. Conformément aux articles L. 1232-2 et suivants du code du travail, nous vous convoquons à un entretien préalable qui se tiendra le mardi 10 novembre 2026 à 10 h 00, au siège de la société, 15 rue de l'Industrie, 83170 Brignoles, dans le bureau de M. Dorian Faure, directeur d'exploitation.

Vous pouvez vous faire assister par une personne de votre choix appartenant au personnel de l'entreprise ou, à défaut de représentants du personnel, par un conseiller du salarié. La liste des conseillers est consultable à la mairie de Brignoles et à l'inspection du travail de Toulon.

Pour toute question, vous pouvez joindre le service du personnel au +33 4.65.71.12.40 ou par courriel à rh@menuiseries-provence-verte.fr.

Veuillez agréer, Monsieur, l'expression de nos salutations distinguées.

Pour Menuiseries de la Provence Verte,
Sandrine Gautier, responsable des ressources humaines
""", [
    ("PERSONNE", "Valentin Lourdes"), ("PERSONNE", "Paule Lourdes"), ("PERSONNE", "Dorian Faure"),
    ("PERSONNE", "Sandrine Gautier"),
    ("ADRESSE", "Les Hauts de Saint-Jean, bâtiment 4\n83170 BRIGNOLES"),
    ("ADRESSE", "15 rue de l'Industrie, 83170 Brignoles"),
    ("ORGANISATION", "Menuiseries de la Provence Verte"),
    ("TELEPHONE", "+33 4.65.71.12.40"), ("EMAIL", "rh@menuiseries-provence-verte.fr"),
    ("DATE", "mardi 10 novembre 2026"),
    ("INSTITUTION", "mairie"), ("INSTITUTION", "inspection du travail"),
    ("LIEU_ISOLE", "Brignoles", "mairie de Brignoles"), ("LIEU_ISOLE", "Toulon"),
])
