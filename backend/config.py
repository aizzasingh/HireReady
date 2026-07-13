from pathlib import Path
from pydantic_settings import BaseSettings

_ENV_FILE = Path(__file__).parent / '.env'


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ADZUNA_APP_ID: str
    ADZUNA_APP_KEY: str
    CORS_ORIGINS: str = 'http://localhost:5500,http://127.0.0.1:5500'

    model_config = {'env_file': str(_ENV_FILE), 'env_file_encoding': 'utf-8'}


settings = Settings()
