"""Defines websocket utility functions."""

from typing import Literal

from fastapi import WebSocket

WebSocketLevel = Literal["error", "info", "success"]


async def maybe_send_message(ws: WebSocket | None, message: str, level: WebSocketLevel = "info") -> None:
    if ws is not None:
        try:
            message_parts = [m.strip() for m in message.split("\n")]
            for message_part in message_parts[::-1]:
                if message_part:
                    await ws.send_text(f"{level}: {message_part}")
        except Exception:
            pass
