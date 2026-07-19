import os
import logging
from groq import Groq
from fastapi import HTTPException, status
from dotenv import load_dotenv
from pathlib import Path

logger = logging.getLogger(__name__)
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(env_path)
class AIService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        
        if not self.api_key:
            logger.warning("GROQ_API_KEY is not set in environment variables.")
            self.client = None
        else:
            try:
                self.client = Groq(api_key=self.api_key)
            except Exception as e:
                logger.error("Failed to initialize Groq Client: %s", str(e))
                self.client = None

    def generate(self, prompt: str) -> str:
        """
        Synchronously call the configured Groq model and return response text.
        """
        if not self.api_key or not self.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq API is not configured or missing a valid API key on this server."
            )
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            if not response or not response.choices or not response.choices[0].message.content:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Received empty content from Groq AI provider."
                )
            return response.choices[0].message.content
        except Exception as e:
            logger.exception("Error during Groq AI generation.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error contacting Groq AI: {str(e)}"
            )

    async def generate_response(self, prompt: str) -> str:
        """
        Async compatibility wrapper for generate.
        """
        return self.generate(prompt)

# Compatibility aliases for existing project router
GeminiService = AIService
