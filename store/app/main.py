"""Defines the main entrypoint for the FastAPI app."""

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator, Callable

import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.security import APIKeyCookie, APIKeyHeader
from starlette.responses import Response

from store.app.db import create_tables
from store.app.errors import (
    BadArtifactError,
    InternalError,
    ItemNotFoundError,
    NotAuthenticatedError,
    NotAuthorizedError,
)
from store.app.routers.artifacts import router as artifacts_router
from store.app.routers.auth import router as auth_router
from store.app.routers.keys import router as keys_router
from store.app.routers.listings import router as listings_router
from store.app.routers.onshape import router as onshape_router
from store.app.routers.orders import router as orders_router
from store.app.routers.robots import router as robots_router
from store.app.routers.stripe import router as stripe_router
from store.app.routers.teleop import router as teleop_router
from store.app.routers.users import router as users_router
from store.utils import get_cors_origins

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Add a console handler if one doesn't exist
if not logger.handlers:
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Initializes the app and creates the database tables."""
    logging.getLogger("aiobotocore").setLevel(logging.CRITICAL)
    await create_tables()
    try:
        yield
    finally:
        pass


# Use APIKeyCookie with the name "AUTH"
cookie_scheme = APIKeyCookie(name="AUTH")

api_key_header = APIKeyHeader(name="Authorization", auto_error=False)

app = FastAPI(
    title="K-Scale",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

# Adds CORS middleware.
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next: Callable[[Request], Response]) -> Response:
    logger.info(f"Request: {request.method} {request.url}")
    response = call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response


@app.exception_handler(ValueError)
async def value_error_exception_handler(request: Request, exc: ValueError) -> JSONResponse:
    logger.error(f"ValueError: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"message": "The request was invalid.", "detail": str(exc)},
    )


@app.exception_handler(ItemNotFoundError)
async def item_not_found_exception_handler(request: Request, exc: ItemNotFoundError) -> JSONResponse:
    logger.error(f"ItemNotFoundError: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"message": "Item not found.", "detail": str(exc)},
    )


@app.exception_handler(InternalError)
async def internal_error_exception_handler(request: Request, exc: InternalError) -> JSONResponse:
    logger.error(f"InternalError: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": "Internal error.", "detail": str(exc)},
    )


@app.exception_handler(NotAuthenticatedError)
async def not_authenticated_exception_handler(request: Request, exc: NotAuthenticatedError) -> JSONResponse:
    logger.error(f"NotAuthenticatedError: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"message": "Not authenticated.", "detail": str(exc)},
    )


@app.exception_handler(NotAuthorizedError)
async def not_authorized_exception_handler(request: Request, exc: NotAuthorizedError) -> JSONResponse:
    logger.error(f"NotAuthorizedError: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"message": "Not authorized.", "detail": str(exc)},
    )


@app.exception_handler(BadArtifactError)
async def bad_artifact_exception_handler(request: Request, exc: BadArtifactError) -> JSONResponse:
    logger.error(f"BadArtifactError: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"message": f"Bad artifact: {exc}", "detail": str(exc)},
    )


@app.get("/")
async def read_root() -> bool:
    return True


@app.get("/openapi.json", include_in_schema=False)
async def get_open_api_endpoint() -> JSONResponse:
    openapi_schema = get_openapi(title="K-Scale", version="1.0.0", routes=app.routes)

    # Add APIKeyHeader security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "APIKeyHeader": {"type": "apiKey", "in": "header", "name": "Authorization"}
    }

    # Define paths that don't require authorization
    unsecured_paths = {
        "/",
        "/auth/api/logout",
        "/auth/email/login",
        "/auth/email/signup",
        "/auth/email/signup/create",
        "/auth/email/signup/delete/{id}",
        "/auth/email/signup/get/{id}",
        "/auth/github/client-id",
        "/auth/github/code",
        "/auth/google/client-id",
        "/auth/google/login",
        "/listings/{id}",
        "/listings/dump",
        "/listings/search",
    }

    # Set default security for all paths
    for path, path_item in openapi_schema["paths"].items():
        for method in path_item.values():
            method["security"] = [{"APIKeyHeader": []}]

    # Remove security for unsecured paths
    for path in unsecured_paths:
        if path in openapi_schema["paths"]:
            for method in openapi_schema["paths"][path].values():
                method.pop("security", None)

    return JSONResponse(openapi_schema)


@app.get("/docs", include_in_schema=False)
async def get_documentation() -> HTMLResponse:
    return get_swagger_ui_html(openapi_url="/openapi.json", title="docs", oauth2_redirect_url="/docs/oauth2-redirect")


@app.get("/docs/oauth2-redirect", include_in_schema=False)
async def get_oauth2_redirect() -> str:
    template_path = Path(__file__).parent / "templates" / "oauth2_redirect.html"
    return template_path.read_text()


async def validate_auth_token(auth_token: str = Depends(api_key_header)) -> str:
    if not auth_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing authentication token")
    return auth_token


app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(artifacts_router, prefix="/artifacts", tags=["artifacts"])
app.include_router(keys_router, prefix="/keys", tags=["keys"])
app.include_router(listings_router, prefix="/listings", tags=["listings"])
app.include_router(onshape_router, prefix="/onshape", tags=["onshape"])
app.include_router(orders_router, prefix="/orders", tags=["orders"])
app.include_router(robots_router, prefix="/robots", tags=["robots"])
app.include_router(stripe_router, prefix="/stripe", tags=["stripe"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(teleop_router, prefix="/teleop", tags=["teleop"])

# For running with debugger
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080)
