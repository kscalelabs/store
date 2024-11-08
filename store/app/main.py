"""Defines the main entrypoint for the FastAPI app."""

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.security import APIKeyCookie, APIKeyHeader

from store.app.db import create_tables
from store.app.errors import (
    BadArtifactError,
    InternalError,
    ItemNotFoundError,
    NotAuthenticatedError,
    NotAuthorizedError,
)
from store.app.routers.artifacts import artifacts_router
from store.app.routers.auth import router
from store.app.routers.kernel_images import kernel_images_router
from store.app.routers.keys import keys_router
from store.app.routers.listings import listings_router
from store.app.routers.onshape import onshape_router
from store.app.routers.orders import orders_router
from store.app.routers.robots import robots_router
from store.app.routers.stripe import stripe_router
from store.app.routers.teleop import teleop_router
from store.app.routers.users import users_router
from store.utils import get_cors_origins


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
        "/kernel-images/public",
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


app.include_router(router, prefix="/auth", tags=["auth"])
app.include_router(artifacts_router, prefix="/artifacts", tags=["artifacts"])
app.include_router(kernel_images_router, prefix="/kernel-images", tags=["kernel-images"])
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
