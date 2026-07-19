import logging
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        pass

    async def generate_response(self, prompt: str, timeout_seconds: float = 10.0) -> str:
        """
        Placeholder method for AI completions.
        """
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="AI provider not configured."
        )

AIService = GeminiService
