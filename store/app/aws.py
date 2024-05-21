"""Entrypoint for AWS Lambda function."""

from mangum import Mangum

from store.app.main import app

handler = Mangum(app)
