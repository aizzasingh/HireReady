from fastapi import APIRouter, Query, HTTPException
import httpx
from ..config import settings

router = APIRouter(prefix='/api/jobs', tags=['jobs'])


@router.get('/search')
async def search_jobs(
    country: str = Query('in', min_length=2, max_length=2),
    role: str = Query('software developer'),
    skills: str = Query(''),
):
    params = {
        'app_id': settings.ADZUNA_APP_ID,
        'app_key': settings.ADZUNA_APP_KEY,
        'results_per_page': 8,
        'what': role[:100],  # cap length
    }
    if skills:
        params['what_or'] = skills[:200]

    url = f'https://api.adzuna.com/v1/api/jobs/{country}/search/1'

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f'Adzuna API error: {e.response.status_code}')
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail='Could not reach Adzuna API')
