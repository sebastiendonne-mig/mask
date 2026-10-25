// Worker de la page de la préversion : charge le modèle (chargeur navigateur, source Hugging Face
// par défaut, empreintes vérifiées) et détecte les entités. Le texte arrive par postMessage et ne
// quitte pas le navigateur ; le Worker ne garde que la dernière demande, le temps de l'analyse.
//
// Messages reçus : { type: 'charger' } puis { type: 'detecter', id, texte }.
// Messages envoyés : { type: 'progression', recus, total }, { type: 'pret' },
// { type: 'resultat', id, masques }, { type: 'erreur', message, id? }.

import * as modele from '/src/modele-navigateur.mjs';

let chargement = null;
let file = Promise.resolve();
let attente = null;

self.onmessage = async ({ data }) => {
  if (data.type === 'charger') {
    // Variante WASM simple, threads par défaut : la configuration mesurée au banc (config d).
    chargement ??= (async () => {
      modele.configurer({ variante: 'simple', surProgression: ({ recus, total }) => self.postMessage({ type: 'progression', recus, total }) });
      await modele.charger();
    })();
    try {
      await chargement;
      self.postMessage({ type: 'pret' });
    } catch (e) {
      self.postMessage({ type: 'erreur', message: String(e?.message ?? e) });
    }
    return;
  }
  if (data.type === 'detecter') {
    // Une analyse à la fois ; une demande dépassée par une plus récente n'est pas traitée.
    attente = data;
    file = file.then(async () => {
      if (attente !== data) return;
      attente = null;
      try {
        await chargement;
        self.postMessage({ type: 'resultat', id: data.id, masques: await modele.detecter(data.texte) });
      } catch (e) {
        self.postMessage({ type: 'erreur', id: data.id, message: String(e?.message ?? e) });
      }
    });
  }
};
