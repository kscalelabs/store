"""Runs tests on the database model, to ensure that it is functioning correctly."""

from store.app.db import Crud, create_tables


async def test_model_functions() -> None:
    async with Crud() as crud:
        await create_tables(crud)

        user = await crud.get_user_from_github_token("test_token", "test@example.com")
        assert user is not None
        assert user.email == "test@example.com"

        user_again = await crud.get_user_from_github_token("test_token", "test@example.com")
        assert user_again is not None
        assert user_again.email == "test@example.com"
