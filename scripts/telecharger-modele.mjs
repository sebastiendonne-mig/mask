// Télécharge les fichiers du modèle camembert-ner à la révision épinglée et vérifie leurs empreintes.
//
//   node scripts/telecharger-modele.mjs              télécharge ce qui manque, puis vérifie tout
//   node scripts/telecharger-modele.mjs --verifier   vérifie seulement (aucun accès réseau)
//
// Seul code du dépôt qui accède au réseau. Liste les fichiers de la révision par l'API
// Hugging Face, télécharge uniquement FICHIERS depuis /resolve/<révision>/.
//
// Manifeste (modeles/MANIFEST.sha256) : s'il contient déjà un fichier, l'empreinte SHA-256
// doit lui être égale. Sinon, le fichier est contrôlé contre l'API (SHA-256 publié pour les
// fichiers LFS, SHA-1 de blob git pour les autres) avant d'y être ajouté. Une entrée
// existante n'est jamais réécrite.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseArgs } from 'node:util';
import { DEPOT, REVISION, FICHIERS, DOSSIER, MANIFESTE, cheminManifeste, sha256Fichier, lireManifeste, verifierFichiers } from '../src/modele-fichiers.mjs';

const HOTE = 'https://huggingface.co';

// Empreinte relevée à l'étape 1 du lot 1.5a, contrôle supplémentaire du modèle.
const SHA256_ONNX_ETAPE_1 = '43507a27e7e5500b5e197c8c7de803bc94bcc29ce156fcbb19bda18ed322960d';

// SHA-1 d'un blob git : sha1("blob <taille>\0" + contenu).
async function sha1BlobGit(chemin) {
  const h = crypto.createHash('sha1');
  h.update(`blob ${fs.statSync(chemin).size}\0`);
  for await (const morceau of fs.createReadStream(chemin)) h.update(morceau);
  return h.digest('hex');
}

async function listerRevision() {
  const url = `${HOTE}/api/models/${DEPOT}/revision/${REVISION}?blobs=true`;
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error(`${url} : HTTP ${reponse.status}`);
  const info = await reponse.json();
  if (info.sha !== REVISION) throw new Error(`l'API renvoie la révision ${info.sha}, attendu ${REVISION}`);
  return new Map(info.siblings.map((s) => [s.rfilename, s]));
}

async function telecharger(fichier, destination) {
  const url = `${HOTE}/${DEPOT}/resolve/${REVISION}/${fichier}`;
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error(`${url} : HTTP ${reponse.status}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const flux = fs.createWriteStream(destination);
  for await (const morceau of reponse.body) {
    if (!flux.write(morceau)) await new Promise((r) => flux.once('drain', r));
  }
  await new Promise((r, e) => flux.end((err) => (err ? e(err) : r())));
}

// Contrôle d'un fichier nouvellement téléchargé contre l'API (et l'étape 1 pour le .onnx).
async function controlerContreApi(fichier, chemin, info, sha256) {
  if (fs.statSync(chemin).size !== info.size) throw new Error(`${fichier} : taille ${fs.statSync(chemin).size}, l'API annonce ${info.size}`);
  if (info.lfs) {
    if (sha256 !== info.lfs.sha256) throw new Error(`${fichier} : SHA-256 ${sha256}, l'API annonce ${info.lfs.sha256}`);
  } else {
    const sha1 = await sha1BlobGit(chemin);
    if (sha1 !== info.blobId) throw new Error(`${fichier} : blob git ${sha1}, l'API annonce ${info.blobId}`);
  }
  if (fichier === 'onnx/model_quantized.onnx' && sha256 !== SHA256_ONNX_ETAPE_1) {
    throw new Error(`${fichier} : SHA-256 ${sha256}, différent de l'étape 1 (${SHA256_ONNX_ETAPE_1})`);
  }
}

async function principal() {
  const { values } = parseArgs({ args: process.argv.slice(2), strict: true, options: { verifier: { type: 'boolean', default: false } } });

  if (!values.verifier) {
    const manifeste = lireManifeste();
    const ajouts = [];
    let siblings = null;
    for (const fichier of FICHIERS) {
      const chemin = path.join(DOSSIER, fichier);
      const attendu = manifeste.get(cheminManifeste(fichier));
      if (fs.existsSync(chemin) && attendu && (await sha256Fichier(chemin)) === attendu) {
        console.log(`présent  ${fichier}`);
        continue;
      }
      siblings ??= await listerRevision();
      const info = siblings.get(fichier);
      if (!info) throw new Error(`${fichier} absent de la révision ${REVISION}`);

      // Téléchargement dans un fichier partiel, mis en place seulement après vérification.
      const partiel = chemin + '.partiel';
      await telecharger(fichier, partiel);
      const sha256 = await sha256Fichier(partiel);
      if (attendu) {
        if (sha256 !== attendu) throw new Error(`${fichier} : SHA-256 ${sha256}, le manifeste attend ${attendu} (fichier partiel laissé : ${partiel})`);
      } else {
        await controlerContreApi(fichier, partiel, info, sha256);
        ajouts.push(`${sha256}  ${cheminManifeste(fichier)}`);
      }
      fs.renameSync(partiel, chemin);
      console.log(`téléchargé  ${fichier}  ${sha256}`);
    }
    if (ajouts.length) {
      fs.mkdirSync(path.dirname(MANIFESTE), { recursive: true });
      fs.appendFileSync(MANIFESTE, ajouts.join('\n') + '\n');
      console.log(`manifeste : ${ajouts.length} entrée(s) ajoutée(s) à ${path.relative(process.cwd(), MANIFESTE)}`);
    }
  }

  await verifierFichiers();
  console.log(`vérifié : ${FICHIERS.length} fichiers conformes au manifeste (${DEPOT}@${REVISION})`);
}

if (import.meta.main) await principal();
