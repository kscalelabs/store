"""Defines the main entrypoint for the FastAPI app."""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from store.app.routers.part import parts_router
from store.app.routers.robot import robots_router
from store.app.routers.users import users_router
from store.settings import settings

app = FastAPI()

# Adds CORS middleware.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.site.homepage],
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


app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(robots_router, prefix="/robots", tags=["robots"])
app.include_router(parts_router, prefix="/parts", tags=["parts"])
