"""Runs tests on the database model, to ensure that it is functioning correctly."""

from store.app.db import Crud, create_tables


async def test_model_functions() -> None:
    async with Crud() as crud:
        await create_tables(crud)

        # Tests that using the same Github token twice will result in the same user.
        assert (user := await crud.get_user_from_github_token("test", "test")) is not None
        assert user.email == "test"
        assert (user := await crud.get_user_from_github_token("test", "test")) is not None
        assert user.email == "test"
        assert len(await crud.list_users()) == 1
