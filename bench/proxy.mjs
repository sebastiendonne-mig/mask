// Proxy local du banc (étape 4a de l'hébergement) : Chrome y envoie ses connexions HTTPS
// (CONNECT), sauf celles vers 127.0.0.1 (option bypass de Playwright). Aucune dépendance.
//
// - Seuls les hôtes du dépôt Hugging Face du modèle sont acceptés (hoteAutorise : huggingface.co
//   et ses sous-domaines *.hf.co), port 443 ; tout autre CONNECT, et toute requête HTTP en clair,
//   reçoit 403 et est consigné (refus).
// - Le tunnel reste chiffré de bout en bout : le proxy ne voit que l'hôte, le port et le nombre
//   d'octets, jamais les URL ni les contenus.
// - Débit : les octets reçus du serveur distant passent par le limiteur (bench/serveur.mjs,
//   creerLimiteur), partagé avec le serveur local : un seul seau de N Mb/s pour toute la page.
// - Journal : un enregistrement par tunnel (hôte, port, octets reçus et envoyés, instants du premier
//   et du dernier octet reçu, en ms depuis le démarrage du proxy, durée une fois fermé).

import http from 'node:http';
import net from 'node:net';

// Hôtes autorisés : huggingface.co et les sous-domaines de hf.co (téléchargement des fichiers).
export const hoteAutorise = (hote) => typeof hote === 'string' && (hote === 'huggingface.co' || /^([a-z0-9-]+\.)+hf\.co$/.test(hote));

// Requêtes vues par Playwright ([{ url }]) vers un hôte hors liste (origine de la page :
// http://127.0.0.1 ; huggingface.co ; *.hf.co), ou vers huggingface.co hors de cheminsAttendus
// (Set de chemins d'URL). Renvoie [{ url (sans la requête), motif }].
export function horsListe(requetes, cheminsAttendus) {
  const sortie = [];
  for (const r of requetes ?? []) {
    const u = new URL(r.url);
    if (['blob:', 'data:'].includes(u.protocol) || (u.protocol === 'http:' && u.hostname === '127.0.0.1')) continue;
    const url = `${u.protocol}//${u.host}${u.pathname}`;
    if (u.protocol !== 'https:' || !hoteAutorise(u.hostname)) sortie.push({ url, motif: 'hôte hors liste' });
    else if (u.hostname === 'huggingface.co' && !cheminsAttendus.has(u.pathname)) sortie.push({ url, motif: 'chemin huggingface.co inattendu' });
  }
  return sortie;
}

const MORCEAU = 64 * 1024;

export function creerProxy({ limiteur = null } = {}) {
  const tunnels = [];
  const refus = [];
  const sockets = new Set();
  const debut = performance.now();
  const instant = () => Math.round(performance.now() - debut);

  const serveur = http.createServer((req, res) => {
    refus.push({ t: instant(), methode: req.method, cible: req.url?.slice(0, 200) ?? '' });
    res.writeHead(403);
    res.end();
  });

  serveur.on('clientError', (e, socket) => socket.destroy());
  serveur.on('connect', (req, client, tete) => {
    // Erreurs du côté Chrome (connexion coupée, y compris après un refus) : consignées sur le
    // tunnel s'il existe, jamais fatales pour le pilote.
    let tunnel = null;
    client.on('error', (e) => {
      if (tunnel) tunnel.erreur ??= `client : ${e.code ?? e.message}`;
      client.destroy();
    });
    const m = /^([^:\s]+):(\d+)$/.exec(req.url ?? '');
    const hote = m?.[1]?.toLowerCase();
    const port = Number(m?.[2]);
    if (!m || port !== 443 || !hoteAutorise(hote)) {
      refus.push({ t: instant(), methode: 'CONNECT', cible: req.url ?? '' });
      client.end('HTTP/1.1 403 Forbidden\r\n\r\n');
      return;
    }
    tunnel = { t: instant(), hote, port, recus: 0, envoyes: 0, premierOctet: null, dernierOctet: null, duree: null, erreur: null };
    tunnels.push(tunnel);
    const distant = net.connect(port, hote, () => {
      client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (tete?.length) {
        tunnel.envoyes += tete.length;
        distant.write(tete);
      }
      client.on('data', (d) => {
        tunnel.envoyes += d.length;
        if (!distant.write(d)) client.pause();
      });
      distant.on('drain', () => client.resume());
    });

    // Distant → Chrome : morceaux d'au plus 64 Kio, chacun après son délai dans le seau partagé.
    let file = Promise.resolve();
    distant.on('data', (d) => {
      distant.pause();
      file = file.then(async () => {
        for (let i = 0; i < d.length; i += MORCEAU) {
          const morceau = d.subarray(i, i + MORCEAU);
          if (limiteur) await new Promise((r) => setTimeout(r, limiteur(morceau.length)));
          if (client.destroyed) return;
          tunnel.recus += morceau.length;
          tunnel.premierOctet ??= instant();
          tunnel.dernierOctet = instant();
          if (!client.write(morceau)) await new Promise((r) => client.once('drain', r));
        }
        distant.resume();
      });
    });
    for (const s of [distant, client]) {
      sockets.add(s);
      s.on('close', () => sockets.delete(s));
    }
    const fin = () => {
      tunnel.duree ??= instant() - tunnel.t;
    };
    distant.on('end', () => file.then(() => client.end()));
    client.on('end', () => distant.end());
    distant.on('close', fin);
    distant.on('error', (e) => {
      tunnel.erreur ??= `distant : ${e.code ?? e.message}`;
      distant.destroy();
      client.destroy();
    });
    client.on('error', () => distant.destroy());
  });

  return {
    tunnels,
    refus,
    vider: () => {
      tunnels.length = 0;
      refus.length = 0;
    },
    ecouter: (port = 0) => new Promise((ok) => serveur.listen(port, '127.0.0.1', () => ok(serveur.address().port))),
    fermer: () =>
      new Promise((ok) => {
        for (const s of sockets) s.destroy();
        serveur.closeAllConnections?.();
        serveur.close(ok);
      }),
  };
}
