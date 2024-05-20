"""Defines the main entrypoint for the FastAPI application."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

FRONTEND_DIR = (Path(__file__).parent / "frontend").resolve()
if not (FRONTEND_BUILD_DIR := FRONTEND_DIR / "build").exists():
    raise FileNotFoundError(f"Frontend is not built to {FRONTEND_BUILD_DIR}")


# Mounts the static frontend files to the /static path.
app.mount("/", StaticFiles(directory=FRONTEND_BUILD_DIR, html=True), name="static")
