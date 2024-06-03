"""Utility functions for sending emails to users."""

import argparse
import asyncio
import datetime
import logging
import textwrap
from dataclasses import dataclass
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from store.app.api.crypto import decode_jwt, encode_jwt
from store.settings import settings

logger = logging.getLogger(__name__)


async def send_email(subject: str, body: str, to: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.email.sender_name} <{settings.email.sender_email}>"
    msg["To"] = to

    msg.attach(MIMEText(body, "html"))

    smtp_client = aiosmtplib.SMTP(hostname=settings.email.host, port=settings.email.port)

    await smtp_client.connect()
    await smtp_client.login(settings.email.username, settings.email.password)
    await smtp_client.sendmail(settings.email.sender_email, to, msg.as_string())
    await smtp_client.quit()


@dataclass
class OneTimePassPayload:
    email: str

    def encode(self) -> str:
        expire_minutes = settings.crypto.expire_otp_minutes
        expire_after = datetime.timedelta(minutes=expire_minutes)
        return encode_jwt({"email": self.email}, expire_after=expire_after)

    @classmethod
    def decode(cls, payload: str) -> "OneTimePassPayload":
        data = decode_jwt(payload)
        return cls(email=data["email"])


async def send_otp_email(payload: OneTimePassPayload, login_url: str) -> None:
    url = f"{login_url}?otp={payload.encode()}"

    body = textwrap.dedent(
        f"""
            <h1><code>K-Scale Labs</code></h1>
            <h2><code><a href="{url}">log in</a></code></h2>
            <p>Or copy-paste this link: {url}</p>
        """
    )

    await send_email(subject="One-Time Password", body=body, to=payload.email)


async def send_delete_email(email: str) -> None:
    body = textwrap.dedent(
        """
            <h1><code>K-Scale Labs</code></h1>
            <h2><code>your account has been deleted</code></h2>
        """
    )

    await send_email(subject="Account Deleted", body=body, to=email)


async def send_waitlist_email(email: str) -> None:
    body = textwrap.dedent(
        """
            <h1><code>K-Scale Labs</code></h1>
            <h2><code>you're on the waitlist!</code></h2>
            <p>Thanks for signing up! We'll let you know when you can log in.</p>
        """
    )

    await send_email(subject="Waitlist", body=body, to=email)


def test_email_adhoc() -> None:
    parser = argparse.ArgumentParser(description="Test sending an email.")
    parser.add_argument("subject", help="The subject of the email.")
    parser.add_argument("body", help="The body of the email.")
    parser.add_argument("to", help="The recipient of the email.")
    args = parser.parse_args()

    asyncio.run(send_email(args.subject, args.body, args.to))


if __name__ == "__main__":
    # python -m bot.api.email
    test_email_adhoc()
