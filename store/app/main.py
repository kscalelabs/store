"""Defines the main entrypoint for the FastAPI app."""

from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from store.app.api.routers.main import api_router
from store.settings import settings

app = FastAPI()

FRONTEND_DIR = (Path(__file__).parent / "frontend").resolve()
if not (FRONTEND_BUILD_DIR := FRONTEND_DIR / "build").exists():
    raise FileNotFoundError(f"Frontend is not built to {FRONTEND_BUILD_DIR}")


app.include_router(api_router, prefix="/api")


@app.exception_handler(ValueError)
async def value_error_exception_handler(request: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"message": "The request was invalid.", "detail": str(exc)},
    )


# Mounts the static frontend files to the /static path.
app.mount("/", StaticFiles(directory=FRONTEND_BUILD_DIR, html=True), name="static")

# Adds CORS middleware.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.site.homepage],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
