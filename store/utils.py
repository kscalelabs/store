"""Defines package-wide utility functions."""

import datetime


def server_time() -> datetime.datetime:
    return datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)
