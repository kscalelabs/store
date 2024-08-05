from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError
from pydantic import EmailStr
from store.app.crud.users import UserCrud
from store.app.model import UserCreate, User
from store.app.utils import jwt_utils
from store.app.utils.jwt_utils import create_access_token, get_current_user
from store.app.utils.verify_email import send_verification_email


router = APIRouter()

@router.post("/signup", response_model=dict)
async def signup(user: UserCreate):
    async with UserCrud() as crud:
        existing_user = await crud.get_user_from_email(user.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        new_user = await crud.create_user(user)
        verification_token = create_access_token(data={"sub": new_user.email})
        await send_verification_email(new_user.email, verification_token)
    return {"message": "User created. Please check your email for verification."}

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    async with UserCrud() as crud:
        user = await crud.authenticate_user(form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not verified",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}

@router.get("/verify")
async def verify_email(token: str):
    try:
        payload = jwt_utils.decode_token(token)
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=400, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    async with UserCrud() as crud:
        user = await crud.get_user_from_email(email)
        if user is None:
            raise HTTPException(status_code=400, detail="User not found")
        if user.is_verified:
            return {"message": "Email already verified"}
        user.is_verified = True
        await crud._update_item(user)
    return {"message": "Email verified successfully"}

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

