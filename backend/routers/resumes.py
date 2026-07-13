import io
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import fitz  # PyMuPDF
import docx
from ..database import get_db
from ..models import User, Resume
from ..auth import get_current_user
from ..analysis import analyze_resume

router = APIRouter(prefix='/api', tags=['resumes'])

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


async def _extract_text(file: UploadFile) -> str:
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail='File exceeds 5 MB limit')

    name = (file.filename or '').lower()
    if name.endswith('.pdf'):
        doc = fitz.open(stream=content, filetype='pdf')
        return '\n'.join(page.get_text() for page in doc)
    if name.endswith('.docx'):
        document = docx.Document(io.BytesIO(content))
        return '\n'.join(p.text for p in document.paragraphs)

    raise HTTPException(status_code=400, detail='Only PDF and DOCX files are supported')


@router.post('/analyze')
async def analyze(
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(''),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    name = (file.filename or '').lower()
    if not (name.endswith('.pdf') or name.endswith('.docx')):
        raise HTTPException(status_code=400, detail='Only PDF and DOCX files are supported')

    resume_text = await _extract_text(file)
    result = analyze_resume(resume_text, job_description or '', file.filename)

    resume = Resume(user_id=current_user.id, filename=file.filename, analysis=result)
    db.add(resume)
    db.commit()

    return result


@router.get('/resumes')
def get_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.uploaded_at.desc())
        .limit(10)
        .all()
    )
    return [
        {
            'id': str(r.id),
            'filename': r.filename,
            'uploadedAt': r.uploaded_at.isoformat(),
            'ats': r.analysis.get('ats'),
            'jobfit': r.analysis.get('jobfit'),
            'content': r.analysis.get('content'),
        }
        for r in rows
    ]
