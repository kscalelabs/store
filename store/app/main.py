"""Defines the main entrypoint for the FastAPI app."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from store.app.db import create_tables
from store.app.routers.image import image_router
from store.app.routers.part import parts_router
from store.app.routers.robot import robots_router
from store.app.routers.users import users_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Initializes the app and creates the database tables."""
    await create_tables()
    try:
        yield
    finally:
        pass


app = FastAPI(lifespan=lifespan)

# Adds CORS middleware.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ValueError)
async def value_error_exception_handler(request: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"message": "The request was invalid.", "detail": str(exc)},
    )


@app.get("/")
async def read_root() -> bool:
    return True


app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(robots_router, prefix="/robots", tags=["robots"])
app.include_router(parts_router, prefix="/parts", tags=["parts"])
app.include_router(image_router, prefix="/image", tags=["image"])
