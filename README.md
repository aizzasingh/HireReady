# HireReady — Resume Analyzer

HireReady helps job seekers review a resume against general ATS checks and an optional job description. It provides scores, detected skills, keyword matches, suggested improvements, saved analysis history, and job-search results.

## What is included

- A responsive HTML, CSS, and vanilla JavaScript frontend
- Account registration and login with JWT authentication
- PDF and DOCX resume uploads (up to 5 MB)
- Resume text extraction and heuristic ATS/content scoring
- Job-description keyword matching using explicit skill matches and TF-IDF similarity
- PostgreSQL-backed users and resume-analysis history
- An Adzuna job-search proxy

The scoring is rule-based with TF-IDF text similarity. It is not a trained ATS model, and results should be treated as guidance rather than a hiring decision.

## Project layout

```
.
├── index.html              # Landing page
├── login.html              # Sign-in page
├── register.html           # Account creation page
├── dashboard.html          # Authenticated application dashboard
├── contact.html            # Contact and legal information
├── style.css               # Shared styles
├── main.js                 # Landing-page behavior
├── auth.js                 # Login and registration behavior
├── user.js                 # Session, API, and local-cache helpers
├── dashboard.js            # Dashboard and upload behavior
├── render.yaml             # Render API service configuration
└── backend/
    ├── main.py             # FastAPI app
    ├── analysis.py         # Resume-analysis logic
    ├── auth.py             # Password hashing and JWT helpers
    ├── database.py         # SQLAlchemy setup
    ├── models.py           # Database models
    ├── schemas.py          # Request/response schemas
    ├── requirements.txt    # Python dependencies
    └── routers/            # Auth, resumes, and jobs endpoints
```

## Run locally

### 1. Set up the backend

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

Create `backend/.env` with your own values:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
SECRET_KEY=use_a_long_random_value_here
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

Start the API:

```bash
uvicorn backend.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`. Visit `/docs` there for interactive API documentation.

### 2. Run the frontend

Start a static web server from the repository root:

```bash
python3 -m http.server 5500
```

Then open `http://127.0.0.1:5500`.

When opened from `localhost` or `127.0.0.1`, the frontend automatically uses the local API at `http://127.0.0.1:8000`. A deployed frontend uses the Render API URL configured in `user.js`.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `POST` | `/api/auth/register` | Create an account and return a token |
| `POST` | `/api/auth/login` | Sign in and return a token |
| `POST` | `/api/analyze` | Analyze an authenticated PDF or DOCX upload |
| `GET` | `/api/resumes` | List the current user's latest analyses |
| `GET` | `/api/jobs/search` | Search jobs through Adzuna |

## Deployment

`render.yaml` defines the FastAPI API service for Render. Configure these environment variables in Render rather than committing them:

- `DATABASE_URL`
- `SECRET_KEY`
- `ADZUNA_APP_ID`
- `ADZUNA_APP_KEY`
- `CORS_ORIGINS` — include the deployed frontend's exact origin

The frontend currently uses the Render API URL configured in `user.js`. If that URL or the frontend domain changes, update the API base URL and the API service's `CORS_ORIGINS` value together.

## Tests

After installing the backend dependencies, run:

```bash
python3 -m unittest discover -s backend/tests
```

## Current limitations

- Resumes are analyzed and their results are stored; original upload files are not retained.
- The app supports PDF and DOCX files only.
- Job search requires valid Adzuna credentials.

## License

[MIT](LICENSE)
