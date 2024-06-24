"""Defines the main entrypoint for the FastAPI app."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import uvicorn

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from store.app.db import create_tables
from store.app.routers.image import image_router
from store.app.routers.part import parts_router
from store.app.routers.robot import robots_router
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


@app.get("/")
async def read_root() -> bool:
    return True


app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(robots_router, prefix="/robots", tags=["robots"])
app.include_router(parts_router, prefix="/parts", tags=["parts"])
app.include_router(image_router, prefix="/image", tags=["image"])

# For running with debugger
if __name__ == "__main__":
   
    uvicorn.run(app, host="127.0.0.1", port=8080)
