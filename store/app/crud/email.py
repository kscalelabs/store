"""This module provides CRUD operations for email sign-up tokens."""

import asyncio
from typing import List

from store.app.crud.base import BaseCrud
from store.app.model import EmailSignUpToken, PasswordResetToken


class EmailCrud(BaseCrud):
    async def create_email_signup_token(self, email: str) -> EmailSignUpToken:
        signup_token = EmailSignUpToken.create(email=email)
        await self._add_item(signup_token)
        return signup_token

    async def get_email_signup_token(self, id: str) -> EmailSignUpToken | None:
        return await self._get_item(id, EmailSignUpToken, throw_if_missing=False)

    async def delete_email_signup_token(self, id: str) -> None:
        await self._delete_item(id)

    async def get_password_reset_token(self, id: str) -> PasswordResetToken | None:
        return await self._get_item(id, PasswordResetToken, throw_if_missing=False)

    async def create_password_reset_token(self, email: str) -> PasswordResetToken:
        reset_token = PasswordResetToken.create(email=email)
        await self._add_item(reset_token)
        return reset_token

    async def delete_password_reset_token(self, id: str) -> None:
        await self._delete_item(id)

    async def delete_password_reset_token_by_email(self, email: str) -> None:
        user_tokens: List[PasswordResetToken] = await self._get_items_from_secondary_index(
            "email", email, PasswordResetToken
        )

        if not user_tokens:
            return

        delete_tasks = [self._delete_item(token.id) for token in user_tokens]
        await asyncio.gather(*delete_tasks)


async def test_adhoc() -> None:
    async with EmailCrud() as crud:
        signup_token = await crud.create_email_signup_token(email="test@example.com")
        await crud.get_email_signup_token(signup_token.id)
        await crud.delete_email_signup_token(signup_token.id)


if __name__ == "__main__":
    asyncio.run(test_adhoc())
