// Détecteurs du lot 1.5a (modèle seul, combiné) sous le moteur de référence (seuils.md,
// amendement (5)) : onnxruntime-web 1.31.0-dev.20260914-8d85527a0, build WebAssembly exécuté
// dans Node (ort.node.min.mjs), 1 thread, session sans options, comme la variante F du
// diagnostic du 22/10 et scripts/navigateur/fidelite.mjs. Utilisé par scripts/evaluer.mjs
// (--moteur wasm --modele <clé>).
//
// Fichier modèle désigné par sa clé dans modeles/MANIFEST.sha256 (chemin relatif à modeles/) :
// refus si la clé est absente du manifeste ou si l'empreinte du fichier diffère.
// Logique de détection inchangée : modele 0.2.0 (src/modele-commun.mjs), tokenizer et
// configuration Xenova épinglés au lot 1.5a ; combiné = règles + modèle, comme src/combine.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as regles from '../../src/regles.mjs';
import { fabriqueDetecteur, preparer, version as versionModele } from '../../src/modele-commun.mjs';
import { DOSSIER, RACINE_MODELES, lireManifeste, sha256Fichier, verifierFichiers } from '../../src/modele-fichiers.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const VERSION_ORT = '1.31.0-dev.20260914-8d85527a0';
export const LOGIQUE = '0.2.0';
export const DETECTEURS = { 'src/modele.mjs': 'modele', 'src/combine.mjs': 'combine' };

// Fichier modèle d'une clé du manifeste : { cle, chemin, octets, sha256 }, refus sinon.
export async function verifierModele(cle) {
  const attendu = lireManifeste().get(cle);
  if (!attendu) throw new Error(`moteur wasm : ${cle} absent de modeles/MANIFEST.sha256`);
  const chemin = path.join(RACINE_MODELES, ...cle.split('/'));
  if (!fs.existsSync(chemin)) throw new Error(`moteur wasm : fichier absent ${path.relative(RACINE, chemin)}`);
  const obtenu = await sha256Fichier(chemin);
  if (obtenu !== attendu) throw new Error(`moteur wasm : empreinte de ${cle} ${obtenu}, le manifeste attend ${attendu}`);
  return { cle, chemin: path.relative(RACINE, chemin), octets: fs.statSync(chemin).size, sha256: obtenu };
}

// Détecteur { nom, version, detecter, moteur } pour 'modele' ou 'combine'. Le modèle est
// vérifié et la session créée au premier appel de detecter().
export async function creerDetecteur(type, cle) {
  if (!Object.values(DETECTEURS).includes(type)) throw new Error(`moteur wasm : détecteur « ${type} » inconnu (modele, combine)`);
  if (!versionModele.startsWith(`${LOGIQUE}+`)) throw new Error(`moteur wasm : logique du modèle ${versionModele}, attendu ${LOGIQUE}`);
  const fichier = await verifierModele(cle);
  const ort = await import(path.join(RACINE, 'node_modules', 'onnxruntime-web', 'dist', 'ort.node.min.mjs'));
  if (ort.env.versions.web !== VERSION_ORT) throw new Error(`moteur wasm : onnxruntime-web ${ort.env.versions.web}, attendu ${VERSION_ORT}`);
  ort.env.wasm.numThreads = 1;

  let chargement = null;
  const charger = () =>
    (chargement ??= (async () => {
      await verifierFichiers(); // tokenizer et configuration épinglés
      const lib = await import('@huggingface/transformers');
      lib.env.allowLocalModels = true;
      lib.env.allowRemoteModels = false;
      lib.env.useFSCache = false;
      lib.env.useBrowserCache = false;
      lib.env.fetch = (url) => {
        throw new Error(`moteur wasm : accès réseau interdit (${url})`);
      };
      const lire = (f) => JSON.parse(fs.readFileSync(path.join(DOSSIER, f), 'utf8'));
      const base = preparer(lib, { tokenizerJson: lire('tokenizer.json'), tokenizerConfig: lire('tokenizer_config.json'), config: lire('config.json') });
      const session = await ort.InferenceSession.create(fs.readFileSync(path.join(RACINE, fichier.chemin)));
      const modele = async ({ input_ids, attention_mask }) => {
        const o = await session.run({
          input_ids: new ort.Tensor('int64', input_ids.data, input_ids.dims),
          attention_mask: new ort.Tensor('int64', attention_mask.data, attention_mask.dims),
        });
        return { logits: { dims: o.logits.dims, data: o.logits.data } };
      };
      return { ...base, modele };
    })());
  const detecterModele = fabriqueDetecteur(charger)();

  const moteur = { paquet: 'onnxruntime-web', version: VERSION_ORT, build: 'WASM, ort.node.min.mjs dans Node', threads: 1, modele: fichier, tokenizer: path.relative(RACINE_MODELES, DOSSIER) };
  const vModele = `${LOGIQUE}+${cle}@${fichier.sha256.slice(0, 12)}+onnxruntime-web@${VERSION_ORT}-wasm-node`;
  if (type === 'modele') return { nom: 'modele', version: vModele, detecter: detecterModele, moteur };
  return {
    nom: 'combine',
    version: `0.1.0+regles@${regles.version}+modele@${vModele}`,
    detecter: async (texte) => [...(await regles.detecter(texte)), ...(await detecterModele(texte))],
    moteur,
  };
}
