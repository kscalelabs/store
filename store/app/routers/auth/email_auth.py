from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError

from store.app.crud.users import UserCrud
from store.app.model import User, UserCreate
from store.app.utils import jwt_utils
from store.app.utils.email import send_verify_email
from store.app.utils.jwt_utils import create_access_token, get_current_user

router = APIRouter()


@router.post("/signup", response_model=dict)
async def signup(user: UserCreate) -> dict[str, str]:
    async with UserCrud() as crud:
        existing_user = await crud.get_user_from_email(user.email)
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        new_user = await crud.create_user(user)
        verification_token = create_access_token(data={"sub": new_user.email})
        await send_verify_email(new_user.email, verification_token)
    return {"message": "User created. Please check your email for verification."}


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> dict[str, str]:
    async with UserCrud() as crud:
        user = await crud.authenticate_user(form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if user.email_verified_at is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not verified",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}


@router.get("/verify/{token}")
async def verify_email(token: str) -> dict[str, str]:
    try:
        payload = jwt_utils.decode_token(token)
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")

    async with UserCrud() as crud:
        user = await crud.get_user_from_email(email)
        if user is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")
        if user.email_verified_at is not None:
            return {"message": "Email already verified"}
        await crud.verify_user(user, token)
    return {"message": "Email verified successfully"}


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
