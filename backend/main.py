from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .config import settings
from .routers import auth, resumes, jobs

# Create tables on startup (safe to run multiple times)
Base.metadata.create_all(bind=engine, checkfirst=True)

app = FastAPI(title='HireReady API', version='1.0.0')

origins = [o.strip() for o in settings.CORS_ORIGINS.split(',') if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth.router)
app.include_router(resumes.router)
app.include_router(jobs.router)


@app.get('/health')
def health():
    """Pinged by cron-job.org every 14 min to prevent Render cold starts."""
    return {'status': 'ok'}
