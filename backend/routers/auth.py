from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import RegisterRequest, LoginRequest, TokenResponse, UserOut
from ..auth import hash_password, verify_password, create_token

router = APIRouter(prefix='/api/auth', tags=['auth'])


@router.post('/register', response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail='Password must be at least 8 characters')
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail='Email already registered')

    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        first_name=req.first_name,
        last_name=req.last_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(
        access_token=create_token(str(user.id)),
        user=UserOut(firstName=user.first_name, lastName=user.last_name, email=user.email),
    )


@router.post('/login', response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail='Invalid email or password')

    return TokenResponse(
        access_token=create_token(str(user.id)),
        user=UserOut(firstName=user.first_name, lastName=user.last_name, email=user.email),
    )
