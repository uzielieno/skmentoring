# SK Mentoring

Landing page premium et back-office d'accompagnement d'étudiants (préparation TAGE MAGE + Pack Emploi + prestations à la carte). Stack **FastAPI + React + MongoDB**.

---

## 🧱 Stack

| Couche | Technologie |
| ------ | ----------- |
| Frontend | React 19 · Tailwind · shadcn/ui · framer-motion · lenis |
| Backend | FastAPI · Motor (MongoDB async) · JWT · bcrypt |
| Base | MongoDB |
| Emails | **Brevo** (Sendinblue) — API transactionnelle |
| Stockage (optionnel) | **Cloudflare R2** (compatible S3, via `boto3`) |

---

## 🚀 Lancer le projet en local

### 1. Prérequis
- Python **3.11+**
- Node **20+** et **yarn**
- MongoDB **6+** (`brew services start mongodb-community` ou Docker)

### 2. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env         # puis renseigne les variables
python server.py              # écoute sur $PORT (défaut 8001)
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env         # REACT_APP_BACKEND_URL=http://localhost:8001
yarn install
yarn start                    # http://localhost:3000
```

### 4. Premier login admin
Aller sur `/admin/login` avec l'email/mot de passe définis dans `ADMIN_EMAIL` / `ADMIN_PASSWORD` (`.env` du backend). Le compte admin est créé automatiquement au premier démarrage.

---

## 🔑 Variables d'environnement

### Backend (`/backend/.env`)

| Variable | Obligatoire | Description |
| -------- | :---------: | ----------- |
| `MONGO_URL` | ✅ | URL de connexion MongoDB |
| `DB_NAME` | ✅ | Nom de la base |
| `PORT` | – | Port d'écoute (défaut `8001`) |
| `HOST` | – | Interface d'écoute (défaut `0.0.0.0`) |
| `CORS_ORIGINS` | ✅ | Origins autorisés, séparés par `,` (`*` pour tout) |
| `JWT_SECRET` | ✅ | Secret HS256 — `python -c "import secrets;print(secrets.token_hex(32))"` |
| `ADMIN_EMAIL` | ✅ | Email du compte admin seed |
| `ADMIN_PASSWORD` | ✅ | Mot de passe admin |
| `BREVO_API_KEY` | ⚠️ | Clé API Brevo v3 (sans clé, l'envoi d'email est ignoré avec un log) |
| `BREVO_API_URL` | – | Défaut `https://api.brevo.com/v3/smtp/email` |
| `EMAIL_FROM_NAME` | ✅ | Nom d'expéditeur |
| `EMAIL_FROM_ADDRESS` | ✅ | Email d'expéditeur (doit être **vérifié dans Brevo**) |
| `EMAIL_TEAM_NOTIFICATION` | – | Email de l'équipe qui reçoit chaque nouvelle inscription |
| `R2_ACCESS_KEY_ID` | – | Cloudflare R2 (uniquement si tu utilises `storage.py`) |
| `R2_SECRET_ACCESS_KEY` | – | idem |
| `R2_BUCKET_NAME` | – | idem |
| `R2_ENDPOINT_URL` | – | `https://<account_id>.r2.cloudflarestorage.com` |

### Frontend (`/frontend/.env`)

| Variable | Obligatoire | Description |
| -------- | :---------: | ----------- |
| `REACT_APP_BACKEND_URL` | ✅ | URL publique du backend, sans slash final |

---

## ✉️ Emails (Brevo)

À chaque nouvelle inscription :
1. Un email **de confirmation** part vers l'étudiant (design premium orange/noir + lien de paiement si configuré).
2. Un email **de notification** part vers `EMAIL_TEAM_NOTIFICATION` (si défini) avec toutes les infos du prospect.

Les templates sont dans **`backend/server.py`** (`_client_email_html` et `_team_email_html`). Simple HTML, très faciles à modifier.

**Setup Brevo :**
1. Compte gratuit sur https://www.brevo.com
2. Clé API v3 : Settings → API keys → colle-la dans `BREVO_API_KEY`
3. Valide ton domaine (Senders & IPs → Domains) pour envoyer depuis `EMAIL_FROM_ADDRESS`

---

## ☁️ Stockage — Cloudflare R2 (optionnel)

Le projet actuel **n'utilise pas** de stockage d'objets. Si tu ajoutes des uploads (photos de mentors, CV, vidéos), utilise `backend/storage.py` :

```python
from storage import get_r2_client, R2_BUCKET_NAME
s3 = get_r2_client()
s3.upload_fileobj(file.file, R2_BUCKET_NAME, "mentors/photo.jpg")
```

`boto3` est déjà dans `requirements.txt`. R2 est 100% compatible S3 (signatures v4, région `auto`).

---

## 🌐 Déploiement

### Backend (Render / Railway / Fly / Heroku…)
- Build : `pip install -r requirements.txt`
- Start : `python server.py`  *(lit `PORT` automatiquement)*
- Fournir toutes les variables du tableau ci-dessus dans l'interface du provider.

Alternative : `uvicorn server:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel / Netlify / Cloudflare Pages…)
- Build : `yarn build`
- Publish dir : `frontend/build`
- Env var : `REACT_APP_BACKEND_URL=https://api.ton-domaine.com`

### MongoDB
- Recommandé : **MongoDB Atlas** (offre gratuite M0) — récupère l'URI et mets-la dans `MONGO_URL`.

---

## 🗺️ Structure

```
.
├── backend/
│   ├── server.py            # API FastAPI (routes /api/*)
│   ├── storage.py           # Helper Cloudflare R2 (optionnel)
│   ├── requirements.txt
│   ├── .env.example
│   └── .env                 # (ignoré par git)
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/           # Landing, Inscription, Admin
│   │   ├── components/
│   │   │   ├── landing/     # Hero, Sections, Pricing, Footer…
│   │   │   ├── ui/          # shadcn/ui
│   │   │   └── SmoothScroll.jsx
│   │   ├── lib/api.js
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   ├── .env.example
│   └── .env                 # (ignoré par git)
├── .gitignore
└── README.md
```

---

## 🧭 Points de vigilance pour la migration

1. **JWT_SECRET** — génère une nouvelle valeur en prod, ne réutilise pas celle du dev.
2. **ADMIN_PASSWORD** — change-le avant la prod. Le compte est re-seedé au démarrage uniquement si l'email n'existe pas encore.
3. **EMAIL_FROM_ADDRESS** — doit être validé côté Brevo (single sender ou domaine authentifié), sinon les envois échouent silencieusement.
4. **CORS_ORIGINS** — en prod, remplace `*` par l'origine exacte de ton frontend (ex : `https://sk-mentoring.com`).
5. **REACT_APP_BACKEND_URL** — pense au **rebuild** du frontend après changement (les `REACT_APP_*` sont inlinées au build).
6. **MongoDB Atlas** — whiteliste l'IP de ton backend, ou `0.0.0.0/0` en dev.
7. **HTTPS obligatoire en prod** — les tokens JWT circulent en Bearer dans les headers.
8. **Liens de paiement** — 100% externes (Stripe / Orange Money / MoMo). Aucun secret côté serveur, tu colles simplement les URLs finales dans l'admin (`/admin` → Liens de paiement).
9. **Photos Mentors** — actuellement des URLs Unsplash directes. Quand tu passes à tes vrais visuels, uploade-les sur R2 et remplace les URLs dans `frontend/src/components/landing/Sections.jsx`.
10. **Rate-limit** — pense à ajouter un rate-limiter (`slowapi`) sur `/api/inscriptions` et `/api/auth/login` avant l'ouverture au public.

---

## 📄 Licence

Propriétaire — SK Mentoring.
