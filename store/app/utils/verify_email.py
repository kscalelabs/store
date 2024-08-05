import logging
from abc import ABC, abstractmethod
from pydantic import EmailStr
from store.settings import settings

logger = logging.getLogger(__name__)

class EmailSender(ABC):
    @abstractmethod
    async def send_verification_email(self, email: EmailStr, token: str):
        pass

class ConsoleEmailSender(EmailSender):
    async def send_verification_email(self, email: EmailStr, token: str):
        verify_url = f"{settings.site.base_url}/auth/verify?token={token}"
        logger.info(f"Sending verification email to {email}")
        logger.info(f"Verification URL: {verify_url}")
        print(f"\n--- Email ---\nTo: {email}\nSubject: Verify your email\nBody: Please click this link to verify your email: {verify_url}\n--- End Email ---\n")

class SMTPEmailSender(EmailSender):
    async def send_verification_email(self, email: EmailStr, token: str):
        # Implement SMTP sending logic here when ready
        pass

def get_email_sender() -> EmailSender:
    if settings.email.use_smtp:
        return SMTPEmailSender()
    return ConsoleEmailSender()

async def send_verification_email(email: EmailStr, token: str):
    sender = get_email_sender()
    await sender.send_verification_email(email, token)