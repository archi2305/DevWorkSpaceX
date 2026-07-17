import os
import logging
import anyio
from fastapi import HTTPException, status
from groq import Groq
from app.ai.prompts import SYSTEM_INSTRUCTION

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.client = None
        if not self.api_key:
            logger.warning("GROQ_API_KEY is not set in environment variables.")
        else:
            try:
                self.client = Groq(api_key=self.api_key)
            except Exception as e:
                logger.error("Failed to initialize Groq Client: %s", str(e))
                self.client = None

    async def generate_response(self, prompt: str, timeout_seconds: float = 10.0) -> str:
        """
        Asynchronously call Groq API with timeout handling.
        """
        if not self.api_key or not self.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq API is not configured or missing a valid API key on this server."
            )
        
        try:
            with anyio.fail_after(timeout_seconds):
                response = await anyio.to_thread.run_sync(
                    lambda: self.client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=[
                            {"role": "system", "content": SYSTEM_INSTRUCTION},
                            {"role": "user", "content": prompt}
                        ]
                    )
                )
                
                if not response or not response.choices or not response.choices[0].message.content:
                    logger.error("Empty response received from Groq API.")
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="Received empty content from AI provider."
                    )
                return response.choices[0].message.content
                
        except TimeoutError:
            logger.error("Groq API call timed out after %s seconds.", timeout_seconds)
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Request to Groq AI timed out."
            )
        except Exception as e:
            logger.exception("Unexpected error occurred while contacting Groq API.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Internal server error occurred while processing AI request: {str(e)}"
            )

AIService = GeminiService
