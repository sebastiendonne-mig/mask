# Vérification de la préversion en ligne (étape 5.3)

- Adresse : <https://mask-seven.vercel.app/>
- Date : 25/10/2026, vers 11 h 24 à 11 h 26 (UTC) ; en-têtes relevés à 11:24:04 GMT, essai Chrome lancé à 11:25:40 UTC.
- Code vérifié : commit `d35141a` (« Préversion : configuration Vercel… ») ; les 38 fichiers servis en ligne ont les mêmes empreintes SHA-256 que la construction locale de ce commit (`node app/construire.mjs`) : 38 / 38 identiques, aucun écart.
- Condition de l'amendement (7) : S1 vérifié sur la version en ligne avant ouverture. Condition du README Hugging Face : empreintes des fichiers du modèle vérifiées par l'app avant usage.

## 1. En-têtes (`curl -sI https://mask-seven.vercel.app/`)

Comparés mot pour mot aux valeurs de `vercel.json` (racine) :

| En-tête | Valeur reçue | Conforme |
|---|---|---|
| Cross-Origin-Opener-Policy | `same-origin` | oui |
| Cross-Origin-Embedder-Policy | `require-corp` | oui |
| Cross-Origin-Resource-Policy | `same-origin` | oui |
| Referrer-Policy | `no-referrer` | oui |
| X-Content-Type-Options | `nosniff` | oui |
| Content-Security-Policy | `default-src 'self'; connect-src 'self' https://huggingface.co https://*.hf.co; script-src 'self' 'wasm-unsafe-eval' blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'` | oui |

Aucun écart sur les 6 en-têtes de `vercel.json`. En-têtes ajoutés par Vercel, absents de `vercel.json` : `access-control-allow-origin: *` (les fichiers statiques publics peuvent être lus par une autre origine ; ils ne contiennent aucune donnée d'utilisateur), `strict-transport-security: max-age=63072000; includeSubDomains; preload`, et les en-têtes techniques `accept-ranges`, `cache-control: public, max-age=0, must-revalidate`, `content-disposition`, `content-type`, `content-length`, `date`, `etag`, `last-modified`, `age`, `server`, `x-vercel-cache`, `x-vercel-id`.

## 2. Fichiers qui ne doivent pas être servis (codes HTTP)

| Chemin | Code |
|---|---|
| `/golden/` | 404 |
| `/golden/dev/dev-avocat-01.txt` | 404 |
| `/resultats/` | 404 |
| `/bench/` | 404 |
| `/scripts/` | 404 |
| `/seuils.md` | 404 |
| `/package.json` | 404 |
| `/CLAUDE.md` | 404 |
| `/vercel.json` | 404 |
| `/app/` | 404 |
| `/src/modele.mjs` | 404 |
| `/node_modules/` | 404 |

## 3. Essai Chrome contre l'adresse en ligne

`node app/essai-chrome.mjs --url https://mask-seven.vercel.app/` : une exécution, code de sortie 0, tous les contrôles conformes. Détail : `verification-en-ligne.json`.

- Navigateur : Chrome 155 (macOS), profil neuf ; Chrome passe par le proxy du banc (`bench/proxy.mjs`, sans limite de débit), sauf pour l'hôte de la page.
- `crossOriginIsolated` : vrai ; aucun avertissement de navigateur affiché.
- Chargement automatique du modèle à l'ouverture (bouton caché, annonce et barre de progression visibles) ; règles affichées avant le modèle (14 éléments sur l'exemple avocat) ; modèle prêt 5 320 ms après l'ouverture (réseau réel, débit non limité) ; détection combinée relancée seule (16 éléments) et case « J'ai relu chaque remplacement » décochée.
- Exemples, avec le modèle :

| Exemple | Éléments (règles + modèle) | Entités | Éléments gardés restants dans le texte pseudonymisé |
|---|---|---|---|
| avocat (`dev-avocat-01`) | 16 | 15 | 0 |
| expert-comptable (`dev-ec-04`) | 19 | 17 | 0 |
| RH (`dev-rh-03`) | 9 | 9 | 0 |

  Pour chacun aussi : pseudonymes présents, « Trouvé par » renseigné, sauts de ligne conservés, copie inactive avant la case de relecture puis identique au texte affiché.
- Réseau (S1) : 48 requêtes vues par Playwright (page et Worker) ; hôtes : `mask-seven.vercel.app`, `huggingface.co`, `us.aws.cdn.hf.co` (et `blob:`, local) ; 0 requête autre que GET ; 0 requête avec un corps ; 0 requête hors liste (chemins `huggingface.co` limités au commit épinglé) ; aucun texte des exemples dans une URL ; aucune violation CSP, aucun message d'erreur en console. Tunnels du proxy : `huggingface.co`, `us.aws.cdn.hf.co` ; connexions refusées par le proxy, toutes hors page (services de Chrome) : `www.gstatic.com`, `www.google.com`, `accounts.google.com`, `update.googleapis.com`, `content-autofill.googleapis.com`, `android.clients.google.com`.
- Stockage : localStorage 0, sessionStorage 0, IndexedDB aucune base ; CacheStorage : `mask-modele-hf-018797af…` (les 4 fichiers du modèle) et `mask-ort-1.31.0-dev.20260914-8d85527a0` (les 2 fichiers WebAssembly d'onnxruntime).
- Empreintes : l'état du chargeur, lu dans le Worker de la page après le chargement, montre la source `hf`, la phase « empreintes » passée et les 4 fichiers du modèle téléchargés pendant la visite (`depuisCache` faux) et vérifiés par SHA-256, chacun égal à `modeles/MANIFEST.sha256` :

| Fichier (commit `018797af…`) | Octets | SHA-256 vérifié |
|---|---|---|
| `config.json` | 892 | `17ec2dd3a642bfc839f3f94bd5ba2e996700aa69b06b3937b0e80b458b962207` |
| `tokenizer.json` | 1 393 411 | `6898886e61473eeb34a66adb7f5e102ec4a8da3217701369320eb784f7415bfd` |
| `tokenizer_config.json` | 269 | `a47e711439fb76c78b60929e8baa3a487a36b476c01886934d5dd2ec5d0c8f8f` |
| `onnx/model_fp16.onnx` | 220 500 160 | `860504f2bf110f34ef7e28b78dbc7b6c2ed2af64a401e5c07b54415ce31958eb` |

  Les copies gardées dans CacheStorage, hachées à nouveau dans la page, ont les mêmes empreintes.

## Non vérifié

- Les 2 fichiers WebAssembly d'onnxruntime ne sont pas vérifiés par empreinte par le chargeur (comme depuis le lot 1.5b) ; ils sont servis par l'origine et font partie des 38 fichiers identiques à la construction locale.
- Visite suivante (modèle lu depuis le cache) sur la version en ligne ; Safari, Firefox, Edge, téléphone et tablette réels ; autres réseaux et régions du CDN.
- Avant cette exécution en ligne, une exécution locale de l'essai (même code) a servi à valider les deux nouveaux contrôles d'empreintes ; elle n'est pas une mesure de la version en ligne.

## Domaine définitif (25/10/2026)

- Adresse : <https://mask.tkoidra.com> ; en-têtes relevés à 11:44:31 GMT, essai Chrome lancé à 11:44:56 UTC.
- Code vérifié : commit `12288aa` ; contenu servi identique à celui de `d35141a` (les fichiers de la page n'ont pas changé depuis) : les 38 fichiers servis ont les mêmes empreintes SHA-256 que la construction locale (`node app/construire.mjs`), 38 / 38, aucun écart.

### En-têtes et redirection

- `curl -sI https://mask.tkoidra.com` : les 6 en-têtes de `vercel.json` (COOP `same-origin`, COEP `require-corp`, CORP `same-origin`, Referrer-Policy `no-referrer`, X-Content-Type-Options `nosniff`, Content-Security-Policy) sont identiques mot pour mot ; aucun écart.
- En-têtes ajoutés par Vercel, absents de `vercel.json` : les mêmes que sur `mask-seven.vercel.app` (dont `access-control-allow-origin: *`), sauf `strict-transport-security`, qui vaut ici `max-age=63072000`, sans `includeSubDomains` ni `preload`.
- `http://mask.tkoidra.com` → `308 Permanent Redirect`, `Location: https://mask.tkoidra.com/` ; un chemin (`/app.css`) est redirigé vers la même adresse en https.

### Fichiers qui ne doivent pas être servis

Tous en 404 : `/golden/`, `/golden/dev/dev-avocat-01.txt`, `/resultats/`, `/bench/`, `/scripts/`, `/seuils.md`, `/package.json`, `/CLAUDE.md`, `/vercel.json`, `/app/`, `/src/modele.mjs`, `/node_modules/`.

### Essai Chrome

`node app/essai-chrome.mjs --url https://mask.tkoidra.com` : une exécution, code de sortie 0, tous les contrôles conformes. Détail : `verification-domaine.json`.

- `crossOriginIsolated` vrai ; aucun avertissement de navigateur affiché ; chargement automatique du modèle ; règles avant le modèle (14 éléments) ; modèle prêt 5 317 ms après l'ouverture ; détection combinée relancée seule (16 éléments), case de relecture décochée.
- Exemples avec le modèle : avocat 15 entités, expert-comptable 17, RH 9 ; aucun élément gardé restant dans le texte pseudonymisé ; copie conforme après la case de relecture.
- Réseau (S1) : 48 requêtes ; hôtes `mask.tkoidra.com`, `huggingface.co`, `us.aws.cdn.hf.co` (et `blob:`, local) ; 0 requête autre que GET, 0 avec un corps, 0 hors liste ; aucun texte des exemples dans une URL ; aucune violation CSP, aucun message d'erreur en console. Connexions refusées par le proxy : services de Chrome seulement (`www.gstatic.com`, `www.google.com`, `accounts.google.com`, `update.googleapis.com`, `content-autofill.googleapis.com`, `android.clients.google.com`).
- Stockage : localStorage 0, sessionStorage 0, IndexedDB aucune base ; CacheStorage : les 4 fichiers du modèle et les 2 fichiers WebAssembly d'onnxruntime.
- Empreintes : état du chargeur lu dans le Worker : source `hf`, phase « empreintes » passée, les 4 fichiers du modèle téléchargés pendant la visite et vérifiés par SHA-256, égaux au manifeste (`config.json` `17ec2dd3…`, `tokenizer.json` `6898886e…`, `tokenizer_config.json` `a47e7114…`, `onnx/model_fp16.onnx` `860504f2…`) ; copies en cache rehachées : mêmes empreintes.
- Non vérifié : comme pour l'adresse Vercel (visite suivante, autres navigateurs, appareils mobiles réels, fichiers WebAssembly non vérifiés par empreinte par le chargeur).
