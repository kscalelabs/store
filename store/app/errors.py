"""Defines common errors used by the application."""


class NotAuthenticatedError(Exception): ...


class NotAuthorizedError(Exception): ...


class ItemNotFoundError(ValueError): ...


class InternalError(RuntimeError): ...


class BadArtifactError(Exception): ...
