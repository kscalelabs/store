"""Defines CRUD interface for user API."""

import asyncio
import warnings

from store.app.api.crud.base import BaseCrud
from store.app.api.model import Token, User


class UserCrud(BaseCrud):
    async def add_user(self, user: User) -> None:
        table = await self.db.Table("Users")
        await table.put_item(Item=user.model_dump())

    async def get_user(self, email: str) -> User | None:
        table = await self.db.Table("Users")
        user_dict = await table.get_item(Key={"email": email})
        if "Item" not in user_dict:
            return None
        user = User.model_validate(user_dict["Item"])
        return user

    async def delete_user(self, user: User) -> None:
        raise NotImplementedError

    async def list_users(self) -> list[User]:
        warnings.warn("`list_users` probably shouldn't be called in production", ResourceWarning)
        table = await self.db.Table("Users")
        users = [User.model_validate(user) for user in await table.scan()]
        return users

    async def get_user_count(self) -> int:
        table = await self.db.Table("Users")
        return await table.item_count

    async def add_token(self, token: Token) -> None:
        table = await self.db.Table("UserTokens")
        await table.put_item(Item=token.model_dump())

    async def get_token(self, email: str, ip_addr: str) -> Token | None:
        table = await self.db.Table("UserTokens")
        token_dict = await table.get_item(Key={"email": email, "ip_addr": ip_addr})
        if "Item" not in token_dict:
            return None
        token = Token.model_validate(token_dict["Item"])
        return token


async def test_adhoc() -> None:
    async with UserCrud() as crud:
        await crud.add_user(User(email="ben@kscale.dev"))
        # print(await crud.get_user("ben"))
        # print(await crud.get_user_count())
        # await crud.get_token("ben")


if __name__ == "__main__":
    # python -m store.app.api.crud.users
    asyncio.run(test_adhoc())
