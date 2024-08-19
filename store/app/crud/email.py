"""This module provides CRUD operations for email sign-up tokens."""

import asyncio

from store.app.crud.base import BaseCrud
from store.app.model import EmailSignUpToken


class EmailCrud(BaseCrud):
    async def create_email_signup_token(self, email: str) -> EmailSignUpToken:
        signup_token = EmailSignUpToken.create(email=email)
        await self._add_item(signup_token)
        return signup_token

    async def get_email_signup_token(self, id: str) -> EmailSignUpToken | None:
        return await self._get_item(id, EmailSignUpToken, throw_if_missing=False)

    async def delete_email_signup_token(self, id: str) -> None:
        await self._delete_item(id)


async def test_adhoc() -> None:
    async with EmailCrud() as crud:
        signup_token = await crud.create_email_signup_token(email="test@example.com")
        await crud.get_email_signup_token(signup_token.id)
        await crud.delete_email_signup_token(signup_token.id)


if __name__ == "__main__":
    asyncio.run(test_adhoc())
