from datetime import datetime, timedelta
from pydantic import EmailStr
from store.app.crud.users import UserCrud
from store.settings import settings
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.auth.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.auth.secret_key, algorithm=settings.auth.algorithm)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.auth.secret_key, algorithms=[settings.auth.algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
   

    async with UserCrud() as crud:
        user = await crud.get_user_from_email(email)  # Remove EmailStr() wrapper
        if user is None:
            raise credentials_exception
    return user

def decode_token(token: str):
    return jwt.decode(token, settings.auth.secret_key, algorithms=[settings.auth.algorithm])