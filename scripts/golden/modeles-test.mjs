// Modèles du JEU DE TEST. Ils ne servent qu'à la mesure finale.
// Ne pas lire ce fichier pour mettre au point les règles : utiliser modeles-dev.mjs.

import {
  f, S, I, NOMS, VILLES, piege, personne, organisation, civ, civLong, accord, fonctionDirigeant, emailPro,
  modelesCabinetAvocats, modelesCabinetComptable, numeroDossier, date, plusJours, iban, fmtIban,
  carte, fmtCarte, fmtSiren, fmtSiret, fmtTva, fmtNir, maj, per, org, adr, dt, mt, lieu, tel, mail,
  dossier, lieuNaissance, arrondi,
} from './lib.mjs';

// --- Avocat --------------------------------------------------------------------

function courrierClient(alea, rang) {
  const avocat = personne(alea);
  const cabinet = organisation(alea, { nomFamille: avocat.nom, modele: alea.choix(modelesCabinetAvocats), formes: ['SELARL', 'SELAS'] });
  const ville = cabinet.adresse.ville;
  const client = personne(alea, piege(rang));
  const voisin = personne(alea);
  const confrere = personne(alea);
  const cabinetAdverse = organisation(alea, { nomFamille: confrere.nom, modele: alea.choix(modelesCabinetAvocats), formes: ['SELARL', 'SCP'] });
  const temoin = personne(alea, { prenom: alea.choix(['Rose', 'Pierre', 'Claire', 'Yann']) });
  const dLettre = date(alea, 2026, 2026);
  const dAudience = plusJours(dLettre, -alea.entier(5, 15));
  const dEntretien = plusJours(dAudience, -alea.entier(10, 30));
  const dConcl1 = plusJours(dLettre, alea.entier(30, 45));
  const dConcl2 = plusJours(dConcl1, alea.entier(30, 45));
  const dPlaidoirie = plusJours(dConcl2, alea.entier(30, 60));
  const dPieces = plusJours(dLettre, alea.entier(10, 20));
  const dProvision = plusJours(dEntretien, -alea.entier(20, 60));
  const reconv = arrondi(alea.entier(3000, 15000));
  const cher = accord(client, 'Chère Madame', 'Cher Monsieur');
  return f`${org(cabinet)}
${adr(cabinet.adresse, 'lignes')}
${tel(alea, cabinet.tel)} — ${mail(cabinet.email)}

PERSONNEL ET CONFIDENTIEL
${civLong(client)} ${per(client, 'pN')}
${adr(client.adresse, 'lignes', alea.chance(0.5))}

${lieu(ville)}, le ${dt(dLettre)}

Nos réf. : ${dossier(numeroDossier(alea, 'cabinet', avocat))}
Affaire : ${per(client, 'N')} c/ ${per(voisin, 'N')}
RG n° ${dossier(numeroDossier(alea, 'rg'))}

${cher},

Je reviens vers vous à la suite de l'audience d'orientation du ${dt(dAudience)} devant le ${I('tribunal judiciaire')} de ${lieu(ville)}.

Comme je vous l'indiquais lors de notre rendez-vous du ${dt(dEntretien, 'num')}, ${civ(voisin)} ${per(voisin, 'pN')}, représenté${accord(voisin, 'e', '')} par Maître ${per(confrere, 'pN')} du cabinet ${org(cabinetAdverse)}, conteste que le mur de pierre séparant vos deux propriétés soit mitoyen. ${accord(voisin, 'Elle', 'Il')} sollicite en outre, à titre reconventionnel, la somme de ${mt(reconv)} au titre de l'élagage des rosiers et de la haie qui, selon ${accord(voisin, 'elle', 'lui')}, empiètent sur son terrain.

Le juge de la mise en état a fixé le calendrier suivant :
- conclusions en défense avant le ${dt(dConcl1)} ;
- nos conclusions en réplique avant le ${dt(dConcl2)} ;
- audience de plaidoiries le ${dt(dPlaidoirie, 'num')} à 14 h, salle 3.

Afin de préparer notre réplique, je vous remercie de me transmettre avant le ${dt(dPieces)} :
- votre titre de propriété et le plan cadastral annexé ;
- les photographies du mur prises avant les travaux ;
- l'attestation de votre voisin${accord(temoin, 'e', '')}, ${civ(temoin)} ${per(temoin, 'pn')}, rédigée sur le formulaire officiel et accompagnée de la copie de sa pièce d'identité.

Je vous rappelle que la provision de ${mt(alea.choix([1200, 1500, 2000]), { insecable: alea.chance(0.5) })} versée le ${dt(dProvision, 'num')} couvre l'ensemble de la procédure de première instance.

Je reste à votre disposition au ${tel(alea, avocat.tel)} ou à l'adresse ${mail(emailPro(alea, avocat, cabinet))}.

Je vous prie de croire, ${cher}, à l'assurance de mes sentiments dévoués.

${per(avocat, 'pN')}
Avocat${accord(avocat, 'e', '')} au ${I('barreau')} de ${lieu(ville)}
`;
}

function assignation(alea, rang) {
  const demandeur = personne(alea, piege(rang));
  const avocat = personne(alea);
  const cabinet = organisation(alea, { nomFamille: avocat.nom, modele: alea.choix(modelesCabinetAvocats), formes: ['SELARL', 'SELAS', 'AARPI'] });
  const ville = cabinet.adresse.ville;
  const commissaire = personne(alea);
  const defenderesse = organisation(alea, { nomFamille: alea.chance(0.7) ? alea.choix(NOMS) : null });
  const expert = organisation(alea, { nomFamille: alea.choix(NOMS), modele: (n) => `Expertises Auto ${n}` });
  const villeRcs = defenderesse.adresse.ville;
  const dActe = date(alea, 2026, 2026);
  const dAudience = plusJours(dActe, alea.entier(30, 70));
  const dAchat = plusJours(dActe, -alea.entier(200, 400));
  const dPanne = plusJours(dAchat, alea.entier(10, 60));
  const dExpertise = plusJours(dPanne, alea.entier(20, 50));
  const dMed = plusJours(dExpertise, alea.entier(15, 40));
  const prix = alea.entier(9, 32) * 1000 - alea.choix([0, 10, 100, 510]);
  const reparations = arrondi(alea.entier(800, 4500) + alea.entier(0, 99) / 100);
  const profession = alea.choix(['infirmier', 'agent immobilier', 'professeur des écoles', 'technicien informatique', 'artisan plombier']);
  const titre = civLong(demandeur);
  return f`ASSIGNATION DEVANT LE ${I('TRIBUNAL JUDICIAIRE')} DE ${lieu(maj(ville))}
(procédure écrite ordinaire — articles 750 et suivants du code de procédure civile)

Le ${dt(dActe)},

À LA REQUÊTE DE :

${titre} ${per(demandeur, 'pN')}, ${accord(demandeur, 'née', 'né')} le ${dt(demandeur.dateNaissance)} à ${lieuNaissance(demandeur)}, de nationalité française, ${profession}, demeurant ${adr(demandeur.adresse)},

Ayant pour avocat constitué Maître ${per(avocat, 'pN')}, avocat${accord(avocat, 'e', '')} au ${I('barreau')} de ${lieu(ville)}, ${org(cabinet)}, ${adr(cabinet.adresse)}, tél. ${tel(alea, cabinet.tel)}, ${mail(emailPro(alea, avocat, cabinet))}, au cabinet duquel il est fait élection de domicile,

Nous, Maître ${per(commissaire, 'pN')}, commissaire de justice à ${lieu(alea.choix([ville, villeRcs]))},

AVONS DONNÉ ASSIGNATION À :

La société ${org(defenderesse, 'raisonMaj')}, au capital de ${mt(defenderesse.capital, { centimes: false })}, immatriculée au ${I('registre du commerce et des sociétés')} de ${lieu(villeRcs)} sous le numéro ${S('SIREN', fmtSiren(defenderesse.siren, true))}, dont le siège social est situé ${adr(defenderesse.adresse)}, prise en la personne de son représentant légal domicilié en cette qualité audit siège,

D'AVOIR À COMPARAÎTRE devant le ${I('tribunal judiciaire')} de ${lieu(ville)}, à l'audience d'orientation du ${dt(dAudience)} à 9 h 30.

TRÈS IMPORTANT : vous êtes tenu de constituer avocat dans un délai de quinze jours à compter de la présente assignation. À défaut, vous vous exposez à ce qu'un jugement soit rendu contre vous sur les seuls éléments fournis par votre adversaire.

OBJET DE LA DEMANDE

I. Les faits

Le ${dt(dAchat)}, ${titre} ${per(demandeur, 'N')} a acquis auprès de la société ${org(defenderesse)} un véhicule d'occasion, au prix de ${mt(prix)}, réglé comptant.

Dès le ${dt(dPanne)}, le véhicule est tombé en panne. L'expertise amiable réalisée le ${dt(dExpertise, 'num')} par le cabinet ${org(expert)} a mis en évidence une défaillance de la boîte de vitesses antérieure à la vente et indécelable pour un acheteur profane.

Par lettre recommandée du ${dt(dMed)}, ${titre} ${per(demandeur, 'N')} a mis en demeure la société de reprendre le véhicule et de lui restituer le prix. Ce courrier est resté sans réponse.

II. Discussion

En application des articles 1641 et suivants du code civil, le vendeur est tenu de la garantie à raison des défauts cachés de la chose vendue qui la rendent impropre à l'usage auquel on la destine. Le vendeur professionnel est présumé connaître les vices de la chose.

PAR CES MOTIFS

Il est demandé au ${I('tribunal')} de :
- PRONONCER la résolution de la vente intervenue le ${dt(dAchat, 'num')} ;
- CONDAMNER la société ${org(defenderesse, 'raisonMaj')} à payer à ${titre} ${per(demandeur, 'pN')} la somme de ${mt(prix)} au titre de la restitution du prix ;
- LA CONDAMNER à lui payer la somme de ${mt(reparations)} au titre des frais de remorquage et de diagnostic ;
- LA CONDAMNER à lui payer la somme de ${mt(alea.choix([1500, 2000, 2500, 3000]), { centimes: false })} en application de l'article 700 du code de procédure civile, ainsi qu'aux entiers dépens.

Liste des pièces communiquées :
1. Facture de vente du ${dt(dAchat, 'num')}
2. Rapport d'expertise amiable du ${dt(dExpertise, 'num')}
3. Mise en demeure du ${dt(dMed, 'num')} et avis de réception

SOUS TOUTES RÉSERVES
`;
}

// --- Expert-comptable ----------------------------------------------------------

function lettreMission(alea, rang) {
  const expert = personne(alea);
  const cabinet = organisation(alea, { nomFamille: expert.nom, modele: alea.choix(modelesCabinetComptable), formes: ['SAS', 'SARL', 'SELARL'] });
  const dirigeant = personne(alea, piege(rang));
  const client = organisation(alea, { nomFamille: alea.chance(0.6) ? dirigeant.nom : null });
  const dLettre = date(alea, 2026, 2026);
  const anExo = dLettre.an;
  const forfait = alea.entier(18, 72) * 100;
  const social = alea.choix([28, 32, 35, 40]);
  const groupe = alea.chance(0.5);
  return f`${org(cabinet, 'raisonMaj')}
Expertise comptable — Conseil
${adr(cabinet.adresse, 'lignes')}
${tel(alea, cabinet.tel)} | ${mail(cabinet.email)}
SIRET ${S('SIRET', fmtSiret(cabinet.siret, groupe))} — TVA ${S('TVA_INTRA', fmtTva(cabinet.siren, groupe))}

${org(client)}
À l'attention de ${civ(dirigeant)} ${per(dirigeant, 'PN')}
${adr(client.adresse, 'lignes', true)}

${lieu(cabinet.adresse.ville)}, le ${dt(dLettre)}

Objet : lettre de mission — présentation des comptes annuels
Dossier n° ${dossier(numeroDossier(alea, 'ec'))}

${civLong(dirigeant)},

Vous avez bien voulu nous consulter en vue de confier à notre cabinet une mission de présentation des comptes annuels de votre société. Nous vous remercions de votre confiance et vous précisons ci-après les conditions de notre intervention.

1. Identification de l'entité
Raison sociale : ${org(client, 'raisonMaj')}
Forme : ${client.forme} au capital de ${mt(client.capital, { centimes: false })}
SIREN : ${S('SIREN', fmtSiren(client.siren, !groupe))}
SIRET du siège : ${S('SIRET', fmtSiret(client.siret, !groupe))}
N° de TVA intracommunautaire : ${S('TVA_INTRA', fmtTva(client.siren, !groupe))}
Représentant légal : ${per(dirigeant, 'pN')}, ${fonctionDirigeant(client, dirigeant)}
Contact : ${mail(emailPro(alea, dirigeant, client))} — ${tel(alea, dirigeant.tel)}

2. Nature et étendue de la mission
Notre mission porte sur l'exercice du ${dt({ an: anExo, mois: 1, jour: 1 })} au ${dt({ an: anExo, mois: 12, jour: 31 })}. Elle comprend la tenue de la comptabilité à partir des pièces que vous nous transmettrez, l'établissement des comptes annuels, des déclarations fiscales de résultat et de la liasse fiscale.
Elle ne comprend ni audit, ni examen limité, ni recherche systématique de fraudes.

3. Honoraires
Nos honoraires sont fixés forfaitairement à ${mt(forfait, { insecable: alea.chance(0.5) })} HT par an, soit ${mt(forfait * 1.2)} TTC, payables par prélèvements mensuels de ${mt(arrondi((forfait * 1.2) / 12))}. L'établissement des bulletins de paie est facturé ${mt(social, { centimes: false })} HT par bulletin.
Les prélèvements seront effectués sur le compte ${S('IBAN', fmtIban(iban(alea), alea.chance(0.7)))}, selon le mandat SEPA joint.

4. Durée
La présente mission est conclue pour une durée d'un an, renouvelable par tacite reconduction, sauf dénonciation par lettre recommandée trois mois avant la date de clôture de l'exercice.

5. Interlocuteurs
Votre dossier est suivi par ${per(expert, 'pN')}, expert-comptable inscrit${accord(expert, 'e', '')} au tableau de l'${I('Ordre')}, assisté${accord(expert, 'e', '')} d'un collaborateur dédié.

Nous vous remercions de nous retourner un exemplaire de la présente lettre revêtu de votre signature, précédée de la mention « Bon pour accord ».

Veuillez agréer, ${civLong(dirigeant)}, l'expression de nos sentiments distingués.

Pour ${org(cabinet)},
${per(expert, 'pN')}
`;
}

function releveCompteClient(alea, rang) {
  const cabinet = organisation(alea, { nomFamille: alea.choix(NOMS), modele: alea.choix(modelesCabinetComptable), formes: ['SAS', 'SARL', 'SELARL'] });
  const dirigeant = personne(alea, piege(rang));
  const client = organisation(alea, { nomFamille: alea.chance(0.5) ? dirigeant.nom : null });
  const comptable = personne(alea);
  const dReleve = date(alea, 2026, 2026);
  const lignes = [];
  let solde = arrondi(alea.entier(0, 900));
  const mouvements = [];
  let d = plusJours(dReleve, -alea.entier(150, 180));
  lignes.push(f`${dt(d, 'num')}  Solde reporté                                   ${mt(solde)}\n`);
  const nbLignes = alea.entier(4, 6);
  for (let k = 0; k < nbLignes; k++) {
    d = plusJours(d, alea.entier(15, 35));
    if (k % 2 === 0) {
      const v = arrondi(alea.entier(3, 18) * 120);
      solde = arrondi(solde + v);
      mouvements.push(v);
      lignes.push(f`${dt(d, 'num')}  Facture n° F-${d.an}-${String(alea.entier(100, 999))}  débit  ${mt(v)}   solde ${mt(solde)}\n`);
    } else {
      const v = arrondi(Math.min(solde, mouvements.at(-1)));
      solde = arrondi(solde - v);
      lignes.push(f`${dt(d, 'num')}  Règlement reçu          crédit ${mt(v)}   solde ${mt(solde)}\n`);
    }
  }
  const carteNum = carte(alea);
  const dCarte = plusJours(dReleve, -alea.entier(5, 40));
  const fraisCarte = arrondi(alea.entier(30, 260) + alea.entier(0, 99) / 100);
  return f`${org(cabinet)}
${adr(cabinet.adresse, alea.chance(0.5) ? 'lignes' : 'ligne')}
TVA intracommunautaire : ${S('TVA_INTRA', fmtTva(cabinet.siren, alea.chance(0.5)))}

RELEVÉ DE COMPTE CLIENT au ${dt(dReleve)}

Client : ${org(client, 'raisonMaj')} — SIREN ${S('SIREN', fmtSiren(client.siren, alea.chance(0.5)))}
Dossier : ${dossier(numeroDossier(alea, 'ec'))}
À l'attention de : ${per(dirigeant, 'Np')}
${adr(client.adresse, 'lignes')}

Date        Libellé                                          Montant
${lignes}
Solde dû au ${dt(dReleve, 'num')} : ${mt(solde)}

Pour mémoire, le paiement de ${mt(fraisCarte)} effectué le ${dt(dCarte, 'num')} avec la carte n° ${S('CARTE', fmtCarte(carteNum, alea.choix(['espace', 'colle', 'tiret'])))} a été rejeté par votre banque : il n'est pas déduit du solde ci-dessus.

Le règlement peut être effectué par virement sur notre compte :
IBAN : ${S('IBAN', fmtIban(iban(alea)))}
en rappelant la référence du dossier.

Pour toute question sur ce relevé, contactez ${per(comptable, 'pn')} au ${tel(alea, comptable.tel)} ou à ${mail(emailPro(alea, comptable, cabinet))}.

Relevé établi à ${lieu(cabinet.adresse.ville)} le ${dt(dReleve, 'num')}.
`;
}

// --- RH ------------------------------------------------------------------------

function contratTravail(alea, rang) {
  const salarie = personne(alea, { ...piege(rang), anNaissance: [1970, 2003] });
  const entreprise = organisation(alea, { nomFamille: alea.chance(0.6) ? alea.choix(NOMS) : null, formes: ['SAS', 'SA', 'SARL'] });
  const drh = personne(alea);
  const dEmbauche = date(alea, 2026, 2026);
  const dSignature = plusJours(dEmbauche, -alea.entier(7, 30));
  const salaireMensuel = arrondi(alea.entier(1900, 4600) + alea.choix([0, 0.5, 0.25]));
  const poste = alea.choix(['chargé de recrutement', 'technicien de laboratoire', 'commercial sédentaire', 'gestionnaire de paie', 'magasinier cariste']);
  const villeTravail = entreprise.adresse.ville;
  return f`CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE

ENTRE LES SOUSSIGNÉS :

La société ${org(entreprise)}, ${entreprise.forme} au capital de ${mt(entreprise.capital, { centimes: false })}, immatriculée sous le numéro SIRET ${S('SIRET', fmtSiret(entreprise.siret, alea.chance(0.5)))}, dont le siège social est situé ${adr(entreprise.adresse)}, représentée par ${civ(drh)} ${per(drh, 'pN')}, en sa qualité de ${accord(drh, 'directrice', 'directeur')} des ressources humaines,
ci-après « l'Employeur »,

ET :

${civLong(salarie)} ${per(salarie, 'PN')}
${accord(salarie, 'Née', 'Né')} le ${dt(salarie.dateNaissance, alea.choix(['long', 'num']))} à ${lieuNaissance(salarie)}
N° de sécurité sociale : ${S('NIR', fmtNir(salarie.nir, alea.chance(0.7) ? 'espace' : 'colle'))}
Demeurant :
${adr(salarie.adresse, 'lignes')}
Téléphone : ${tel(alea, salarie.tel)}
Courriel : ${mail(salarie.email)}
ci-après « le Salarié »,

IL A ÉTÉ CONVENU CE QUI SUIT :

Article 1 — Engagement
${civLong(salarie)} ${per(salarie, 'N')} est engagé${accord(salarie, 'e', '')} à compter du ${dt(dEmbauche)} en qualité de ${poste}, statut employé, niveau III de la convention collective applicable. La déclaration préalable à l'embauche a été effectuée auprès de l'${I('URSSAF')}.

Article 2 — Période d'essai
Le contrat ne deviendra définitif qu'à l'issue d'une période d'essai de deux mois, renouvelable une fois d'un commun accord.

Article 3 — Lieu de travail
Le Salarié exercera ses fonctions à ${lieu(villeTravail)}. Des déplacements ponctuels, notamment vers l'agence de ${lieu(alea.choix(VILLES).nom)}, pourront être demandés.

Article 4 — Durée du travail
La durée hebdomadaire de travail est fixée à 35 heures, réparties du lundi au vendredi.

Article 5 — Rémunération
En contrepartie de son travail, le Salarié percevra une rémunération mensuelle brute de ${mt(salaireMensuel, { insecable: alea.chance(0.5) })}, versée le dernier jour ouvré de chaque mois, sur le compte bancaire désigné par le Salarié. Une prime annuelle de ${mt(alea.choix([500, 800, 1000, 1200]), { centimes: false })} brut est versée en décembre, au prorata du temps de présence.

Article 6 — Congés payés
Le Salarié bénéficie des congés payés prévus par la loi et la convention collective.

Fait à ${lieu(villeTravail)}, le ${dt(dSignature)}, en deux exemplaires.

Pour l'Employeur                          Le Salarié
${per(drh, 'pN')}                          ${per(salarie, 'pN')}
                                          (mention « lu et approuvé »)
`;
}

function attestationEmployeur(alea, rang) {
  const salarie = personne(alea, { ...piege(rang), anNaissance: [1965, 2002] });
  const entreprise = organisation(alea, { nomFamille: alea.chance(0.6) ? alea.choix(NOMS) : null });
  const signataire = personne(alea);
  const dEntree = date(alea, 2012, 2024);
  const dAttest = date(alea, 2026, 2026);
  const salaire = arrondi(alea.entier(2000, 5200) + alea.choix([0, 0.33, 0.5]));
  const poste = alea.choix(['comptable unique', 'conducteur poids lourd', 'assistant de direction', 'responsable des achats', 'boulanger']);
  const objet = alea.choix(['la constitution de son dossier de location', 'sa demande de prêt immobilier', f`son dossier auprès de la ${I("caisse d'allocations familiales")}`]);
  return f`${org(entreprise, 'raisonMaj')}
${adr(entreprise.adresse, 'lignes')}
SIRET : ${S('SIRET', fmtSiret(entreprise.siret, alea.chance(0.5)))}
Tél. : ${tel(alea, entreprise.tel)}

ATTESTATION D'EMPLOI

${accord(signataire, 'Je soussignée', 'Je soussigné')}, ${per(signataire, 'pN')}, agissant en qualité de responsable des ressources humaines de la société ${org(entreprise)}, atteste que :

${civLong(salarie)} ${per(salarie, alea.choix(['PN', 'Np']))},
${accord(salarie, 'née', 'né')} le ${dt(salarie.dateNaissance, 'num')} à ${lieuNaissance(salarie)},
immatriculé${accord(salarie, 'e', '')} à la sécurité sociale sous le numéro ${S('NIR', fmtNir(salarie.nir, alea.chance(0.5) ? 'espace' : 'colle'))},
demeurant ${adr(salarie.adresse, alea.chance(0.5) ? 'ligne' : 'lignes')},

est employé${accord(salarie, 'e', '')} au sein de notre société depuis le ${dt(dEntree)}, en contrat à durée indéterminée, en qualité de ${poste}, à temps complet.

${accord(salarie, 'Elle', 'Il')} n'est ni en période d'essai, ni en préavis de démission ou de licenciement à la date de la présente attestation. Sa rémunération mensuelle brute s'élève à ${mt(salaire)}.

Cette attestation est délivrée à l'intéressé${accord(salarie, 'e', '')}, à sa demande, pour ${objet}, et pour servir et valoir ce que de droit.

Pour toute vérification, le service des ressources humaines peut être joint au ${tel(alea, entreprise.tel)} ou à l'adresse ${mail(emailPro(alea, signataire, entreprise))}.

Fait à ${lieu(entreprise.adresse.ville)}, le ${dt(dAttest)}

${per(signataire, 'pN')}
Cachet de l'entreprise
`;
}

// --- Documents sans donnée personnelle -----------------------------------------

function circulaireFacturation(alea) {
  const an = 2026;
  return f`CIRCULAIRE AUX CLIENTS DU CABINET — FACTURATION ÉLECTRONIQUE

La généralisation de la facturation électronique entre entreprises entre dans sa phase opérationnelle. Voici les dates à retenir et ce qu'elles changent pour votre entreprise.

Calendrier
- À partir du ${dt({ an, mois: 9, jour: 1 })} : toutes les entreprises doivent être en mesure de recevoir des factures électroniques ; les grandes entreprises et les entreprises de taille intermédiaire doivent aussi les émettre.
- À partir du ${dt({ an: an + 1, mois: 9, jour: 1 })} : obligation d'émission étendue aux petites et moyennes entreprises et aux microentreprises.

Ce qui change
Les factures papier et les simples fichiers PDF envoyés par courriel ne suffiront plus : chaque facture devra transiter par une plateforme agréée. Le seuil de ${mt(alea.choix([150, 250]), { centimes: false })} HT applicable aux factures simplifiées n'est pas modifié par la réforme.

Notre accompagnement
Un atelier d'information aura lieu dans nos locaux de ${lieu(alea.choix(VILLES).nom)} le ${dt(date(alea, an, an))}, puis en visioconférence le ${dt(date(alea, an, an), 'num')}. La participation est gratuite ; l'inscription est obligatoire auprès de l'accueil du cabinet.

Pierre angulaire de la réforme, la plateforme choisie doit être retenue dès maintenant : nous vous recommandons de ne pas attendre le dernier trimestre pour faire ce choix.
`;
}

function compteRenduReunion(alea) {
  const dReunion = date(alea, 2026, 2026);
  const budget = alea.entier(12, 40) * 1000;
  return f`COMPTE RENDU — COMITÉ DE PILOTAGE DU PROJET « ARCHIVAGE »

Réunion du ${dt(dReunion)}, de 10 h à 11 h 30, salle Rose (3e étage).
Présents : la direction administrative et financière, le service juridique, le service informatique, deux représentants du personnel.

1. Avancement
La numérisation des dossiers clos avant le ${dt({ an: 2015, mois: 12, jour: 31 }, 'num')} est achevée à 80 %. Le reliquat concerne les archives conservées sur le site de ${lieu(alea.choix(VILLES).nom)}, dont le transfert est prévu le ${dt(plusJours(dReunion, alea.entier(20, 40)), 'num')}.

2. Budget
Le budget consommé s'élève à ${mt(arrondi(budget * 0.62), { insecable: true })} sur une enveloppe de ${mt(budget, { centimes: false, insecable: true })}. Aucun dépassement n'est anticipé.

3. Règles de conservation
Le service juridique rappelle que les durées de conservation ne se fixent pas au cas par cas : elles découlent du tableau de gestion validé en comité. Toute destruction anticipée est interdite.

4. Décisions
- Validation du prestataire de stockage pour une durée de trois ans ;
- Formation des référents prévue la semaine du ${dt(plusJours(dReunion, alea.entier(45, 60)))}.

Prochaine réunion : ${dt(plusJours(dReunion, alea.entier(60, 90)), 'num')}.
`;
}

function fichePrudhommes(alea) {
  return f`FICHE PRATIQUE — SAISIR LE ${I("CONSEIL DE PRUD'HOMMES")}

À quoi sert-il ?
Le ${I("conseil de prud'hommes")} règle les litiges individuels nés du contrat de travail : licenciement, salaires impayés, heures supplémentaires, sanctions disciplinaires.

Dans quels délais ?
- Contestation d'un licenciement : 12 mois à compter de sa notification ;
- Rappel de salaire : 3 ans ;
- Discrimination ou harcèlement : 5 ans.

Comment ?
La saisine se fait par requête déposée au ${I('greffe')} ou envoyée par lettre recommandée, ou en ligne. Elle doit exposer les demandes et les pièces sur lesquelles elles reposent.

Combien ?
La saisine est gratuite. En cas de licenciement sans cause réelle et sérieuse, l'indemnité est encadrée par un barème : par exemple, pour un salarié comptant deux ans d'ancienneté, entre 3 et 3,5 mois de salaire brut. Pour un salaire de ${mt(2600, { centimes: false })}, cela représente de ${mt(7800, { centimes: false })} à ${mt(9100, { centimes: false })}.

Le saviez-vous ?
Le conseil compétent est en principe celui du lieu de l'établissement où le travail est effectué : un salarié de l'agence de ${lieu(alea.choix(VILLES).nom)} saisit le conseil de cette ville, même si le siège est à ${lieu('Paris')}.

Fiche mise à jour le ${dt(date(alea, 2026, 2026))}. Elle a une valeur informative et ne remplace pas un conseil personnalisé.
`;
}

function annonceSeminaire(alea) {
  const dDepart = date(alea, 2027, 2027);
  const prix = alea.entier(9, 16) * 100;
  return f`SÉMINAIRE D'ÉTUDE — DROIT DES AFFAIRES EN EUROPE

Voyage d'étude à ${lieu('Florence')}, du ${dt(dDepart)} au ${dt(plusJours(dDepart, 3))}

Programme
Jour 1 : accueil, présentation du droit italien des sociétés et comparaison avec le droit français.
Jour 2 : visite d'une juridiction commerciale, échanges avec des praticiens locaux.
Jour 3 : atelier sur le recouvrement transfrontalier des créances et l'injonction de payer européenne.
Jour 4 : retour à ${lieu('Lyon')} en fin de matinée.

Tarifs
Inscription complète : ${mt(prix, { centimes: false })} HT par participant, transport et hébergement compris.
Inscription sans hébergement : ${mt(prix - 350, { centimes: false })} HT.
Supplément chambre individuelle : ${mt(220, { centimes: false })}.

Formation éligible au titre de la formation continue obligatoire : 20 heures validées.
Clôture des inscriptions le ${dt(plusJours(dDepart, -alea.entier(45, 60)), 'num')}. Nombre de places limité à 25.
`;
}

function guideTeletravail(alea) {
  const dEffet = date(alea, 2026, 2026);
  return f`GUIDE INTERNE — TÉLÉTRAVAIL

Entrée en vigueur : ${dt(dEffet)}

1. Qui peut télétravailler ?
Tout salarié dont les fonctions sont compatibles avec le travail à distance, après six mois d'ancienneté, sur demande écrite validée par son responsable.

2. Combien de jours ?
Deux jours par semaine au maximum, fixés à l'avance. Les jours de présence collective sont le mardi et le jeudi.

3. Équipement et indemnité
L'entreprise fournit un ordinateur portable et un casque. Une indemnité forfaitaire de ${mt(alea.choix([2.5, 2.7, 3]), { insecable: true })} par jour télétravaillé, dans la limite de ${mt(alea.choix([55, 59.4, 60]), { insecable: true })} par mois, est versée avec le salaire.

4. Sécurité des données
Les documents de travail ne sont jamais enregistrés sur un équipement personnel ni envoyés vers une messagerie personnelle. Les échanges confidentiels passent par les outils fournis.

5. Droit à la déconnexion
Aucune réponse n'est attendue entre 19 h et 8 h, ni pendant les congés. Les responsables montrent l'exemple.

Le présent guide sera réexaminé avant le ${dt(plusJours(dEffet, 365), 'num')}. Les remarques peuvent être adressées au service des ressources humaines ou déposées dans la boîte à idées du site de ${lieu(alea.choix(VILLES).nom)}.
`;
}

export const MODELES_TEST = [
  { id: 'avocat-courrier-client', persona: 'avocat', fabriquer: courrierClient },
  { id: 'avocat-assignation', persona: 'avocat', fabriquer: assignation },
  { id: 'ec-lettre-mission', persona: 'expert-comptable', fabriquer: lettreMission },
  { id: 'ec-releve-compte-client', persona: 'expert-comptable', fabriquer: releveCompteClient },
  { id: 'rh-contrat-travail', persona: 'rh', fabriquer: contratTravail },
  { id: 'rh-attestation-emploi', persona: 'rh', fabriquer: attestationEmployeur },
  { id: 'neutre-circulaire-facturation', persona: 'aucune', fabriquer: circulaireFacturation },
  { id: 'neutre-compte-rendu-reunion', persona: 'aucune', fabriquer: compteRenduReunion },
  { id: 'neutre-fiche-prudhommes', persona: 'aucune', fabriquer: fichePrudhommes },
  { id: 'neutre-annonce-seminaire', persona: 'aucune', fabriquer: annonceSeminaire },
  { id: 'neutre-guide-teletravail', persona: 'aucune', fabriquer: guideTeletravail },
];
