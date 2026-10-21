// Modèles du JEU DE DÉVELOPPEMENT. Ils servent à mettre au point les règles.
// Aucun de ces modèles n'est utilisé pour le jeu de test (voir modeles-test.mjs).

import {
  f, S, NOMS, VILLES, piege, personne, organisation, civ, civLong, accord, fonctionDirigeant, emailPro,
  modelesCabinetAvocats, modelesCabinetComptable, numeroDossier, date, plusJours, iban, fmtIban,
  carte, fmtCarte, fmtSiren, fmtSiret, fmtTva, fmtNir, per, org, adr, dt, mt, lieu, tel, mail, dossier,
  lieuNaissance, arrondi,
} from './lib.mjs';

// --- Avocat --------------------------------------------------------------------

function miseEnDemeure(alea, rang) {
  const avocat = personne(alea);
  const cabinet = organisation(alea, { nomFamille: avocat.nom, modele: alea.choix(modelesCabinetAvocats), formes: ['SELARL', 'SELAS'] });
  const villeCab = cabinet.adresse.ville;
  const client = personne(alea, piege(rang));
  const adverse = organisation(alea, { nomFamille: alea.choix(NOMS) });
  const gerant = personne(alea);
  const dLettre = date(alea, 2026, 2026);
  const dDevis = plusJours(dLettre, -alea.entier(150, 260));
  const dPaiement = plusJours(dDevis, alea.entier(5, 20));
  const dFin = plusJours(dPaiement, alea.entier(45, 90));
  const dConstat = plusJours(dFin, alea.entier(10, 40));
  const prix = arrondi(alea.entier(4800, 38000) + alea.entier(0, 99) / 100);
  const ma = accord(client, 'ma cliente', 'mon client');
  return f`${org(cabinet, 'raisonMaj')}
Avocats au barreau de ${lieu(villeCab)}
${adr(cabinet.adresse, 'lignes')}
Tél. : ${tel(alea, cabinet.tel)} — ${mail(cabinet.email)}

${org(adverse)}
À l'attention de ${civ(gerant)} ${per(gerant, 'pN')}, ${fonctionDirigeant(adverse, gerant)}
${adr(adverse.adresse, 'lignes', true)}

${lieu(villeCab)}, le ${dt(dLettre)}

LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION
Nos réf. : ${dossier(numeroDossier(alea, 'cabinet', avocat))}

Objet : mise en demeure

Madame, Monsieur,

J'interviens en qualité de conseil de ${civLong(client)} ${per(client, 'pN')}, demeurant ${adr(client.adresse)}, dans le litige qui l'oppose à votre société.

Le ${dt(dDevis)}, ${ma} vous a confié la rénovation complète de sa cuisine, selon un devis accepté pour un montant de ${mt(prix)} TTC, intégralement réglé le ${dt(dPaiement, 'num')}. Les travaux devaient être achevés au plus tard le ${dt(dFin)}. À ce jour, ils ne sont pas terminés : le plan de travail en pierre n'a jamais été posé, et les malfaçons relevées par procès-verbal de constat du ${dt(dConstat)} n'ont fait l'objet d'aucune reprise.

En conséquence, je vous mets en demeure de rembourser à ${ma} la somme de ${mt(arrondi(prix * 0.4))}, correspondant aux prestations non exécutées, dans un délai de quinze jours à compter de la réception de la présente, par virement sur son compte :
IBAN ${S('IBAN', fmtIban(iban(alea)))}

À défaut, j'ai d'ores et déjà reçu instruction de saisir le tribunal judiciaire de ${lieu(villeCab)}, afin d'obtenir ce remboursement, outre des dommages et intérêts et la prise en charge des frais de procédure.

Je vous précise que la présente vaut mise en demeure au sens de l'article 1344 du code civil et fait courir les intérêts au taux légal.

Je reste à la disposition de votre conseil, qui pourra me joindre au ${tel(alea, avocat.tel)} ou à l'adresse ${mail(emailPro(alea, avocat, cabinet))}.

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

Maître ${per(avocat, 'pN')}
`;
}

const OBJETS_LITIGE = [
  'la contestation de son licenciement',
  "un vice caché affectant un véhicule d'occasion",
  'un défaut de livraison de mobilier',
  'un litige locatif portant sur la restitution du dépôt de garantie',
];

function conventionHonoraires(alea, rang) {
  const client = personne(alea, piege(rang));
  const avocat = personne(alea);
  const cabinet = organisation(alea, { nomFamille: avocat.nom, modele: alea.choix(modelesCabinetAvocats), formes: ['SELARL', 'SELAS', 'SCP'] });
  const ville = cabinet.adresse.ville;
  const adverse = alea.chance(0.5) ? f`la société ${org(organisation(alea))}` : (() => { const a = personne(alea); return f`${civ(a)} ${per(a, 'pN')}`; })();
  const dSignature = date(alea, 2025, 2026);
  const forfait = alea.choix([1500, 1800, 2400, 3000, 3600]);
  const horaire = alea.choix([180, 200, 220, 250]);
  const provision = arrondi(forfait * 0.4);
  const insecable = alea.chance(0.5);
  return f`CONVENTION D'HONORAIRES

Entre les soussignés :

${civLong(client)} ${per(client, 'PN')}, ${accord(client, 'née', 'né')} le ${dt(client.dateNaissance, 'num')} à ${lieuNaissance(client)}, demeurant ${adr(client.adresse)}, joignable au ${tel(alea, client.tel)} et à l'adresse ${mail(client.email)},
ci-après dénommé${accord(client, 'e', '')} « le Client »,

Et

${org(cabinet)}, société d'avocats inscrite au barreau de ${lieu(ville)}, SIRET ${S('SIRET', fmtSiret(cabinet.siret, alea.chance(0.5)))}, dont le siège est situé ${adr(cabinet.adresse)}, représentée par Maître ${per(avocat, 'pn')},
ci-après dénommée « l'Avocat »,

Il a été convenu ce qui suit.

Article 1 — Objet
Le Client confie à l'Avocat la défense de ses intérêts dans le litige qui l'oppose à ${adverse}, relatif à ${alea.choix(OBJETS_LITIGE)}. Le dossier est enregistré sous la référence ${dossier(numeroDossier(alea, 'cabinet', avocat))}.

Article 2 — Honoraires
Les honoraires sont fixés au forfait de ${mt(forfait, { insecable })} HT, soit ${mt(forfait * 1.2, { insecable })} TTC, pour la procédure de première instance. Les diligences non comprises dans ce forfait sont facturées au taux horaire de ${mt(horaire, { centimes: false, insecable })} HT. Un honoraire de résultat de 10 % HT des sommes effectivement obtenues est en outre convenu.

Article 3 — Provision et règlement
Une provision de ${mt(provision, { insecable })} est versée à la signature des présentes. Les factures sont payables à réception, par virement sur le compte du cabinet (IBAN ${S('IBAN', fmtIban(iban(alea), alea.chance(0.6)))}).

Article 4 — Dessaisissement
Le Client peut à tout moment dessaisir l'Avocat. Les honoraires restent dus au prorata des diligences accomplies jusqu'à la date du dessaisissement.

Article 5 — Différend
Toute contestation relative aux honoraires est soumise au bâtonnier de l'ordre des avocats du barreau de ${lieu(ville)}.

Fait à ${lieu(ville)}, le ${dt(dSignature)}, en deux exemplaires originaux.

Le Client                                   L'Avocat
${per(client, 'pn')}                          Maître ${per(avocat, 'iN')}
`;
}

// --- Expert-comptable ----------------------------------------------------------

function attestationChiffreAffaires(alea, rang) {
  const expert = personne(alea);
  const cabinet = organisation(alea, { nomFamille: expert.nom, modele: alea.choix(modelesCabinetComptable), formes: ['SAS', 'SARL', 'SELARL'] });
  const dirigeant = personne(alea, piege(rang));
  const client = organisation(alea, { nomFamille: alea.chance(0.6) ? dirigeant.nom : null });
  const an = alea.choix([2024, 2025]);
  const ca = arrondi(alea.entier(180000, 2400000) + alea.entier(0, 99) / 100);
  const caPrec = arrondi(ca * (0.8 + alea.entier(0, 35) / 100));
  const dAttestation = date(alea, an + 1, an + 1);
  return f`${org(cabinet)}
Société d'expertise comptable inscrite au tableau de l'Ordre
${adr(cabinet.adresse, 'lignes')}
SIRET ${S('SIRET', fmtSiret(cabinet.siret, true))} — TVA ${S('TVA_INTRA', fmtTva(cabinet.siren, alea.chance(0.5)))}
Tél. ${tel(alea, cabinet.tel)}

ATTESTATION DE L'EXPERT-COMPTABLE
Chiffre d'affaires de l'exercice clos le ${dt({ an, mois: 12, jour: 31 })}

En notre qualité d'expert-comptable de la société ${org(client, 'raisonMaj')}, dont le siège social est situé ${adr(client.adresse)}, immatriculée sous le numéro SIREN ${S('SIREN', fmtSiren(client.siren, alea.chance(0.5)))} (TVA intracommunautaire ${S('TVA_INTRA', fmtTva(client.siren, alea.chance(0.5)))}), et à la demande de son dirigeant, ${civ(dirigeant)} ${per(dirigeant, 'pN')}, nous avons mis en œuvre les diligences prévues par la norme professionnelle applicable aux attestations.

Sur la base des comptes annuels établis par nos soins, le chiffre d'affaires hors taxes de l'exercice du ${dt({ an, mois: 1, jour: 1 }, 'num')} au ${dt({ an, mois: 12, jour: 31 }, 'num')} s'élève à ${mt(ca)}, contre ${mt(caPrec)} pour l'exercice précédent.

Nos travaux ne constituent ni un audit ni un examen limité. Ils ont consisté à rapprocher le montant attesté de la comptabilité et des déclarations de TVA déposées par la société.

La présente attestation est établie pour être remise à l'établissement bancaire de la société dans le cadre d'une demande de financement ; elle ne peut être utilisée à d'autres fins.

Fait à ${lieu(cabinet.adresse.ville)}, le ${dt(dAttestation)}

${per(expert, 'pN')}
Expert-comptable associé${accord(expert, 'e', '')}
${mail(emailPro(alea, expert, cabinet))}
`;
}

function relancePieces(alea, rang) {
  const expert = personne(alea);
  const cabinet = organisation(alea, { nomFamille: alea.chance(0.5) ? expert.nom : alea.choix(NOMS), modele: alea.choix(modelesCabinetComptable), formes: ['SAS', 'SARL', 'SELARL'] });
  const collab = personne(alea);
  const dirigeant = personne(alea, piege(rang));
  const client = organisation(alea, { nomFamille: alea.chance(0.5) ? alea.choix(NOMS) : null });
  const salarie = personne(alea);
  const an = alea.choix([2025, 2026]);
  const dMail = date(alea, an + 1, an + 1);
  const dLimite = plusJours(dMail, alea.entier(10, 21));
  const dVehicule = date(alea, an, an);
  const dSalon = date(alea, an, an);
  // Piège : la ville de Florence, homonyme d'un nom de famille du jeu.
  const salon = rang === 0 ? 'Florence' : alea.choix(VILLES).nom;
  const dirMail = emailPro(alea, dirigeant, client);
  return f`De : ${per(expert, 'pn')} <${mail(emailPro(alea, expert, cabinet))}>
À : ${per(dirigeant, 'pn')} <${mail(dirMail)}>
Cc : ${per(collab, 'pn')} <${mail(emailPro(alea, collab, cabinet))}>
Date : ${dt(dMail, 'num')}
Objet : clôture ${an} — pièces manquantes (dossier ${dossier(numeroDossier(alea, 'ec'))})

Bonjour ${civLong(dirigeant)} ${per(dirigeant, 'n')},

Pour finaliser les comptes annuels de ${org(client)} au ${dt({ an, mois: 12, jour: 31 })}, il nous manque encore les éléments suivants :

- les relevés bancaires d'octobre à décembre du compte professionnel ${S('IBAN', fmtIban(iban(alea), alea.chance(0.7)))} ;
- le relevé annuel de la carte bancaire professionnelle n° ${S('CARTE', fmtCarte(carte(alea), alea.choix(['espace', 'colle', 'tiret'])))} ;
- la facture d'achat du véhicule utilitaire acquis le ${dt(dVehicule)}, pour environ ${mt(alea.entier(18, 42) * 1000, { centimes: false })} HT ;
- le détail des notes de frais de ${per(salarie, 'pN')} pour le salon professionnel de ${lieu(salon)}, du ${dt(dSalon, 'num')} au ${dt(plusJours(dSalon, 2), 'num')}.

La liasse fiscale doit être transmise au plus tard le ${dt({ an: an + 1, mois: 5, jour: 19 })}. Sans ces pièces d'ici le ${dt(dLimite)}, nous ne pourrons pas tenir ce délai.

${per(collab, 'pn')}, qui suit votre dossier au quotidien, reste joignable au ${tel(alea, collab.tel)} pour toute question.

Bien cordialement,

${per(expert, 'pN')}
${org(cabinet)}
${adr(cabinet.adresse)}
${tel(alea, cabinet.tel)}
`;
}

// --- RH ------------------------------------------------------------------------

function promesseEmbauche(alea, rang) {
  const candidat = personne(alea, { ...piege(rang), anNaissance: [1975, 2003] });
  const entreprise = organisation(alea, { nomFamille: alea.chance(0.5) ? alea.choix(NOMS) : null });
  const drh = personne(alea);
  const dLettre = date(alea, 2026, 2026);
  const dEntree = plusJours(dLettre, alea.entier(20, 75));
  const dReponse = plusJours(dLettre, 10);
  const salaire = alea.entier(24, 52) * 1000;
  const poste = alea.choix(['assistant administratif', 'technicien de maintenance', 'chargé de clientèle', 'comptable fournisseurs', 'responsable logistique']);
  const lieuTravail = alea.choix([entreprise.adresse.ville, alea.choix(VILLES).nom]);
  return f`${org(entreprise, 'raisonMaj')}
${adr(entreprise.adresse, 'lignes')}
SIRET : ${S('SIRET', fmtSiret(entreprise.siret, alea.chance(0.5)))}

${civLong(candidat)} ${per(candidat, 'pN')}
${adr(candidat.adresse, 'lignes', alea.chance(0.5))}

${lieu(entreprise.adresse.ville)}, le ${dt(dLettre)}

Objet : promesse d'embauche

${civLong(candidat)},

À la suite de nos entretiens, nous avons le plaisir de vous confirmer notre intention de vous engager en contrat à durée indéterminée, en qualité de ${poste}, à compter du ${dt(dEntree)}.

Vous exercerez vos fonctions à ${lieu(lieuTravail)}, sous la responsabilité de ${civ(drh)} ${per(drh, 'pn')}. Votre rémunération annuelle brute sera de ${mt(salaire, { centimes: false, unite: 'euros' })}, versée sur douze mois. Le contrat comportera une période d'essai de deux mois, renouvelable une fois.

Cette promesse est valable jusqu'au ${dt(dReponse, 'num')}. Nous vous remercions de nous retourner un exemplaire signé à l'adresse ${mail(emailPro(alea, drh, entreprise))}.

Pour toute question, vous pouvez joindre le service des ressources humaines au ${tel(alea, entreprise.tel)}.

Nous nous réjouissons de vous accueillir prochainement et vous prions d'agréer, ${civLong(candidat)}, nos salutations distinguées.

${per(drh, 'pN')}
${accord(drh, 'Directrice', 'Directeur')} des ressources humaines
`;
}

function bulletinPaie(alea, rang) {
  const salarie = personne(alea, { ...piege(rang), anNaissance: [1970, 2003] });
  const entreprise = organisation(alea, { nomFamille: alea.chance(0.6) ? alea.choix(NOMS) : null, formes: ['SAS', 'SARL', 'SA'] });
  const dEntree = date(alea, 2015, 2025);
  const mois = alea.entier(1, 9);
  const debut = { an: 2026, mois, jour: 1 };
  const fin = plusJours({ an: 2026, mois: mois + 1, jour: 1 }, -1);
  const brut = arrondi(alea.entier(1900, 4200) + alea.choix([0, 0.5]));
  const cotisations = arrondi(brut * 0.22);
  const net = arrondi(brut - cotisations);
  const taux = alea.choix([2.5, 4.1, 6.3, 7.5]);
  const impot = arrondi((net * taux) / 100);
  const poste = alea.choix(['préparateur de commandes', 'assistant commercial', 'technicien de maintenance', 'comptable']);
  const insecable = alea.chance(0.5);
  return f`BULLETIN DE PAIE
Période du ${dt(debut, 'num')} au ${dt(fin, 'num')}

EMPLOYEUR
${org(entreprise, 'raisonMaj')}
${adr(entreprise.adresse, 'lignes')}
SIRET : ${S('SIRET', fmtSiret(entreprise.siret, alea.chance(0.5)))}
Convention collective : commerce de gros

SALARIÉ
${civLong(salarie)} ${per(salarie, 'Np')}
${adr(salarie.adresse, 'lignes', true)}
N° de sécurité sociale : ${S('NIR', fmtNir(salarie.nir, alea.chance(0.6) ? 'espace' : 'colle'))}
Emploi : ${poste} — coefficient 210
Date d'entrée : ${dt(dEntree, 'num')}

Rubrique                                          Montant
Salaire de base (151,67 h)                        ${mt(brut, { insecable })}
Total brut                                        ${mt(brut, { insecable })}
Cotisations et contributions salariales           - ${mt(cotisations, { insecable })}
Net à payer avant impôt sur le revenu             ${mt(net, { insecable })}
Impôt sur le revenu prélevé à la source (${String(taux).replace('.', ',')} %)  - ${mt(impot, { insecable })}
Net payé                                          ${mt(arrondi(net - impot), { insecable })}

Payé par virement le ${dt(fin, 'num')} sur le compte ${S('IBAN', fmtIban(iban(alea), alea.chance(0.6)))}

Dans votre intérêt, conservez ce bulletin de paie sans limitation de durée.
Une question sur votre paie ? Service paie : ${tel(alea, entreprise.tel)} — ${mail(entreprise.email)}
`;
}

// --- Documents sans donnée personnelle -----------------------------------------

function noteNotesDeFrais(alea) {
  const dEffet = date(alea, 2026, 2026);
  const ville = alea.choix(VILLES).nom;
  return f`NOTE INTERNE — PROCÉDURE DE REMBOURSEMENT DES NOTES DE FRAIS

Applicable à compter du ${dt(dEffet)}

1. Principe
Les frais engagés pour les besoins du service sont remboursés sur justificatif original, dans la limite des plafonds ci-dessous. Une dépense sans justificatif ne peut pas être remboursée, quelle que soit sa nature.

2. Plafonds
- Repas d'affaires : ${mt(alea.choix([25, 28, 30]), { centimes: false })} par personne ;
- Nuitée en province : ${mt(alea.choix([95, 110, 120]), { centimes: false })}, petit-déjeuner compris ;
- Nuitée à ${lieu('Paris')} : ${mt(alea.choix([140, 160]), { centimes: false })} ;
- Indemnités kilométriques : barème fiscal en vigueur.

3. Calendrier
Les notes de frais du mois sont déposées au plus tard le 5 du mois suivant. Les remboursements interviennent avec la paie. Pour l'exercice en cours, la dernière date de dépôt est fixée au ${dt({ an: dEffet.an, mois: 12, jour: 5 }, 'num')}.

4. Déplacements groupés
Pour le séminaire annuel de ${lieu(ville)}, les billets et l'hébergement sont réservés directement par les services généraux ; aucune avance de frais n'est demandée aux participants.

Cette procédure n'a pas vocation à jeter la pierre à quiconque : elle vise seulement à traiter toutes les demandes de la même façon et dans les mêmes délais.
`;
}

function ficheCongesPayes(alea) {
  const an = alea.choix([2026, 2027]);
  return f`FICHE PRATIQUE — CONGÉS PAYÉS ${an}

Période de référence
Les congés s'acquièrent du ${dt({ an: an - 1, mois: 6, jour: 1 })} au ${dt({ an, mois: 5, jour: 31 })}, à raison de 2,5 jours ouvrables par mois de travail effectif, soit 30 jours ouvrables pour une année complète.

Prise des congés
Le congé principal d'au moins douze jours ouvrables continus est pris entre le ${dt({ an, mois: 5, jour: 1 }, 'num')} et le ${dt({ an, mois: 10, jour: 31 }, 'num')}. Les demandes sont à déposer avant le ${dt({ an, mois: 3, jour: 1 })} pour la période estivale.

Indemnité
L'indemnité de congés payés est égale au dixième de la rémunération brute de la période de référence, sans pouvoir être inférieure au salaire qui aurait été perçu pendant le congé. Exemple : pour une rémunération annuelle de ${mt(30000, { insecable: true })}, l'indemnité minimale s'élève à ${mt(3000, { insecable: true })}.

Jours fériés
Un jour férié chômé tombant pendant les congés n'est pas décompté. Le lundi de Pentecôte reste une journée de solidarité travaillée.

À retenir
Le planning est validé par chaque responsable d'équipe et affiché au plus tard un mois avant le départ. Une question ? Consultez l'intranet, rubrique « Ressources humaines », onglet « Rose des vents » consacré aux mobilités.
`;
}

export const MODELES_DEV = [
  { id: 'avocat-mise-en-demeure', persona: 'avocat', fabriquer: miseEnDemeure },
  { id: 'avocat-convention-honoraires', persona: 'avocat', fabriquer: conventionHonoraires },
  { id: 'ec-attestation-chiffre-affaires', persona: 'expert-comptable', fabriquer: attestationChiffreAffaires },
  { id: 'ec-relance-pieces', persona: 'expert-comptable', fabriquer: relancePieces },
  { id: 'rh-promesse-embauche', persona: 'rh', fabriquer: promesseEmbauche },
  { id: 'rh-bulletin-paie', persona: 'rh', fabriquer: bulletinPaie },
  { id: 'neutre-note-frais', persona: 'aucune', fabriquer: noteNotesDeFrais },
  { id: 'neutre-fiche-conges', persona: 'aucune', fabriquer: ficheCongesPayes },
];
