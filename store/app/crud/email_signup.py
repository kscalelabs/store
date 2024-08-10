"""This module provides CRUD operations for email sign-up tokens."""

from store.app.crud.base import BaseCrud
from store.app.model import EmailSignUpToken


class EmailSignUpCrud(BaseCrud):
    async def create_email_signup_token(self, email: str) -> EmailSignUpToken:
        token = EmailSignUpToken.create(email=email)
        await self._add_item(token)
        return token

    async def get_email_signup_token(self, token: str) -> EmailSignUpToken | None:
        return await self._get_item(token, EmailSignUpToken, throw_if_missing=False)

    async def delete_email_signup_token(self, token: str) -> None:
        await self._delete_item(token)


async def test_adhoc() -> None:
    async with EmailSignUpCrud() as crud:
        token = await crud.create_email_signup_token(email="test@example.com")
        retrieved_token = await crud.get_email_signup_token(token.token)
        print(f"Retrieved Token: {retrieved_token}")
        await crud.delete_email_signup_token(token.token)
