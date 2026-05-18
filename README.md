# 🎂 Birthday Basic Monorepo

Full‑stack birthday party experience built with a **Next.js frontend** and a **Django REST backend**, sharing a single repository.

---

## 📁 Repository structure

```text
.
├── frontend/                # Next.js 14 app (guest site + admin UI)
│   ├── src/app/             # App Router pages & API routes
│   ├── src/components/      # Shared React components
│   ├── src/config/party.js  # Party‑specific configuration
│   └── RAILWAY_*.md         # Frontend deployment/env docs
│
├── backend/                 # Django 4 / DRF API
│   ├── birthday/            # Django project (settings, URLs, WSGI)
│   ├── birthdayapi/         # App with models, views, fixtures
│   ├── media/               # Local media uploads (dev) or mounted volume
│   ├── requirements.txt     # Python dependencies
│   └── RAILWAY_*.md         # Backend deployment docs
│
├── package.json             # Root npm workspace config (for frontend)
└── README.md
```

---

## 🛠️ Tech stack

- **Frontend**
  - Next.js 14 (App Router), React 18
  - Firebase (client SDK) for authentication
  - Bootstrap / React‑Bootstrap for styling

- **Backend**
  - Django 4.2, Django REST Framework
  - Firebase Admin SDK for auth
  - PostgreSQL in production, SQLite by default for local dev
  - Optional S3 storage (via `django-storages` + `boto3`) for media

---

## ✅ Prerequisites

- **Node.js** ≥ 16 and **npm** ≥ 8 (see `package.json`)
- **Python** ≥ 3.9
- **pip** or **pipenv**
- (Prod) A PostgreSQL database and Firebase project

---

## 🐍 Backend (Django API)

### 1. Install dependencies

```bash
cd backend

# Using virtualenv (recommended)
 python -m venv birthdaybasic
source birthdaybasic/Scripts/activate # Windows

pip install -r requirements.txt
```

You can also use Pipenv if you prefer (`Pipfile` is included).

### 2. Configure environment

The backend reads configuration from environment variables (optionally via a `.env` file in `backend/birthday/`):

- **Core Django**
  - `SECRET_KEY` – Django secret key (required in production)
  - `DEBUG` – `True`/`False` (default: `True`)
  - `ALLOWED_HOSTS` – comma‑separated hostnames (`localhost,127.0.0.1` by default)

- **Database**
  - `DATABASE_URL` – if set, Django uses this (e.g. Railway/Render PostgreSQL URL)
  - If **not** set, SQLite at `backend/birthday/db.sqlite3` is used for local dev

- **CORS**
  - `CORS_ALLOWED_ORIGINS` – comma‑separated allowed origins for the frontend  
    (defaults include `http://localhost:3000` and `http://localhost:8000`)

- **Firebase Admin**
  - `FIREBASE_SERVICE_ACCOUNT_JSON` – full service account JSON in one env var (single line), parsed at startup.  
    This is what we use for Railway deploys; see `backend/RAILWAY_DEPLOY.md` for an example.

- **Media / S3 (optional)**
  - `USE_S3` – `True` to enable S3 storage
  - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
  - `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_REGION_NAME`, `AWS_S3_CUSTOM_DOMAIN`

### 3. Run migrations and (optionally) load fixtures

```bash
cd backend
python manage.py migrate

# Optional sample data
python manage.py loaddata birthdayapi/fixtures/party.json
python manage.py loaddata birthdayapi/fixtures/timeline_events.json
python manage.py loaddata birthdayapi/fixtures/trivia_questions.json
python manage.py loaddata birthdayapi/fixtures/user.json
```

### 4. Start the backend server

```bash
cd backend
python manage.py runserver 8000
```

The API will be available at `http://localhost:8000/`.

---

## 🖥️ Frontend (Next.js app)

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

Create a `.env.local` file in `frontend/` (or set variables in your hosting provider):

- **API base URL**
  - `NEXT_PUBLIC_API_URL=http://localhost:8000` (for local dev)

- **Firebase + party configuration**
  - See `frontend/RAILWAY_ENV_VARS.md` for the full list of `NEXT_PUBLIC_*` variables
    (Firebase config, party details, colors, etc.). The same variables work for local
    development and deployment; only the API URL typically changes.

### 3. Start the frontend

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:3000/`.

Make sure the backend (`http://localhost:8000`) is running so API calls and auth work.

---

## 📦 Root npm scripts

The root `package.json` is configured as an npm workspace host and is primarily used to orchestrate the **frontend**:

- `npm run dev` – runs `next dev` in workspaces that define a `dev` script (the frontend)
- `npm run build` – builds all Node workspaces
- `npm run test` – runs tests in Node workspaces (if defined)
- `npm run lint` – lints Node workspaces

You still start the **backend** directly with Python commands (`python manage.py …`) as shown above.

---

## ☁️ Deployment

This repo includes deployment guides for both apps:

- **Backend**: see `backend/RAILWAY_QUICK_START.md` and `backend/RAILWAY_DEPLOY.md`  
  (Railway + persistent media storage, database, and environment variables).
- **Frontend**: see `frontend/RAILWAY_QUICK_START.md` and `frontend/RAILWAY_ENV_VARS.md`.  
  The recommended setup is **Vercel for the Next.js frontend** and **Railway for the Django backend**.

Ensure you keep `CORS_ALLOWED_ORIGINS` (backend) and `NEXT_PUBLIC_API_URL` (frontend) in sync
between environments.

---

## 💡 Development tips

- Use a Python virtual environment in `backend/` to avoid polluting global packages.
- Run frontend and backend in separate terminals for a smooth development loop.
- For production, always set `DEBUG=False`, a strong `SECRET_KEY`, and HTTPS‑only origins.
