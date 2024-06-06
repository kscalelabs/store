"""Defines the main API endpoint."""

from fastapi import APIRouter, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from store.app.api.routers.robot import robots_router
from store.app.api.routers.users import users_router
from store.settings import settings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.site.homepage],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

api_router = APIRouter()

app.include_router(api_router, prefix="/api")
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(robots_router, tags=["robots"])


# Returns a 404 response for all other paths.
@api_router.get("/{path:path}")
async def not_found(path: str) -> dict[str, str]:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endpoint not found")
