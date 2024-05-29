"""Defines the main entrypoint for the FastAPI app."""

from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.datastructures import Headers

from store.app.api.routers.main import api_router
from store.settings import settings

app = FastAPI()

FRONTEND_DIR = (Path(__file__).parent / "frontend").resolve()
if not (FRONTEND_BUILD_DIR := FRONTEND_DIR / "build").exists():
    raise FileNotFoundError(f"Frontend is not built to {FRONTEND_BUILD_DIR}")

FRONTEND_STATIC_DIR = FRONTEND_BUILD_DIR / "static"
if not FRONTEND_STATIC_DIR.exists():
    raise FileNotFoundError(f"Frontend static files not found at {FRONTEND_STATIC_DIR}")

FRONTEND_INDEX_FILE = FRONTEND_BUILD_DIR / "index.html"
if not FRONTEND_INDEX_FILE.exists():
    raise FileNotFoundError(f"Frontend index file not found at {FRONTEND_INDEX_FILE}")

FRONTEND_OTHER_FILES = {f.name for f in FRONTEND_BUILD_DIR.glob("*") if f.is_file()}

app.include_router(api_router, prefix="/api")


@app.exception_handler(ValueError)
async def value_error_exception_handler(request: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"message": "The request was invalid.", "detail": str(exc)},
    )


class NotModifiedResponse(Response):
    NOT_MODIFIED_HEADERS = (
        "cache-control",
        "content-location",
        "date",
        "etag",
        "expires",
        "vary",
    )

    def __init__(self, headers: Headers):
        super().__init__(
            status_code=304,
            headers={name: value for name, value in headers.items() if name in self.NOT_MODIFIED_HEADERS},
        )


# Mounts the static frontend files to the /static path.
app.mount("/static", StaticFiles(directory=FRONTEND_STATIC_DIR, html=True), name="/static")


# Redirects all other paths to the index.html file.
@app.get("/{full_path:path}")
async def redirect_to_index(full_path: str, request: Request) -> Response:
    if full_path in FRONTEND_OTHER_FILES:
        return await StaticFiles(directory=FRONTEND_BUILD_DIR).get_response(full_path, request.scope)
    return await StaticFiles(directory=FRONTEND_BUILD_DIR).get_response("index.html", request.scope)


# Adds CORS middleware.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.site.homepage],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
