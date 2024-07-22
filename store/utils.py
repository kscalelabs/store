"""Defines package-wide utility functions."""

import datetime
from collections import OrderedDict
from typing import Generic, Hashable, TypeVar, overload

Tk = TypeVar("Tk", bound=Hashable)
Tv = TypeVar("Tv")


class LRUCache(Generic[Tk, Tv]):
    def __init__(self, capacity: int) -> None:
        super().__init__()

        self.cache: OrderedDict[Tk, Tv] = OrderedDict()
        self.capacity = capacity

    @overload
    def get(self, key: Tk) -> Tv | None: ...

    @overload
    def get(self, key: Tk, default: Tv) -> Tv: ...

    def get(self, key: Tk, default: Tv | None = None) -> Tv | None:
        if key not in self.cache:
            return None
        else:
            self.cache.move_to_end(key)
            return self.cache[key]

    def __contains__(self, key: Tk) -> bool:
        return key in self.cache

    def __len__(self) -> int:
        return len(self.cache)

    def put(self, key: Tk, value: Tv) -> None:
        self.cache[key] = value
        self.cache.move_to_end(key)
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

    def __getitem__(self, key: Tk) -> Tv:
        if (item := self.get(key)) is None:
            raise KeyError(key)
        return item

    def __setitem__(self, key: Tk, value: Tv) -> None:
        self.put(key, value)


def server_time() -> datetime.datetime:
    return datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)
