"""Defines the main API endpoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from store.app.routers.part import parts_router
from store.app.routers.robot import robots_router
from store.app.routers.users import users_router
from store.settings import settings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.site.homepage],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(robots_router, prefix="/robots", tags=["robots"])
app.include_router(parts_router, prefix="/parts", tags=["parts"])
