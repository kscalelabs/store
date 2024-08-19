"""Defines the main entrypoint for the FastAPI app."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from store.app.db import create_tables
from store.app.errors import (
    BadArtifactError,
    InternalError,
    ItemNotFoundError,
    NotAuthenticatedError,
    NotAuthorizedError,
)
from store.app.routers.artifacts import artifacts_router
from store.app.routers.email_signup import email_router
from store.app.routers.listings import listings_router
from store.app.routers.urdf import urdf_router
from store.app.routers.users import users_router
from store.settings import settings

LOCALHOST_URLS = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Initializes the app and creates the database tables."""
    logging.getLogger("aiobotocore").setLevel(logging.CRITICAL)
    await create_tables()
    try:
        yield
    finally:
        pass


app = FastAPI(lifespan=lifespan)

# Adds CORS middleware.
app.add_middleware(
    CORSMiddleware,
    allow_origins={settings.site.homepage, *LOCALHOST_URLS},
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


@app.exception_handler(ItemNotFoundError)
async def item_not_found_exception_handler(request: Request, exc: ItemNotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"message": "Item not found.", "detail": str(exc)},
    )


@app.exception_handler(InternalError)
async def internal_error_exception_handler(request: Request, exc: InternalError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": "Internal error.", "detail": str(exc)},
    )


@app.exception_handler(NotAuthenticatedError)
async def not_authenticated_exception_handler(request: Request, exc: NotAuthenticatedError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"message": "Not authenticated.", "detail": str(exc)},
    )


@app.exception_handler(NotAuthorizedError)
async def not_authorized_exception_handler(request: Request, exc: NotAuthorizedError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"message": "Not authorized.", "detail": str(exc)},
    )


@app.exception_handler(BadArtifactError)
async def bad_artifact_exception_handler(request: Request, exc: BadArtifactError) -> JSONResponse:
    print("error:", exc)
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"message": f"Bad artifact: {exc}", "detail": str(exc)},
    )


@app.get("/")
async def read_root() -> bool:
    return True


app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(listings_router, prefix="/listings", tags=["listings"])
app.include_router(artifacts_router, prefix="/artifacts", tags=["artifacts"])
app.include_router(email_router, prefix="/email", tags=["email"])
app.include_router(urdf_router, prefix="/urdf", tags=["urdf"])

# For running with debugger
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080)
