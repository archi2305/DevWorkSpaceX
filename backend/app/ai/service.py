import os
import logging
import anyio
from fastapi import HTTPException, status
from google import genai
from google.genai.errors import APIError
from app.ai.prompts import SYSTEM_INSTRUCTION

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set in environment variables.")
        else:
            try:
                # Initialize client. The google-genai SDK handles API key retrieval internally via environment or accepts api_key parameter.
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error("Failed to initialize Gemini Client: %s", str(e))
                self.client = None

    async def generate_response(self, prompt: str, timeout_seconds: float = 10.0) -> str:
        """
        Asynchronously call Google Gemini API with timeout handling.
        """
        if not self.api_key or not self.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini API is not configured or missing a valid API key on this server."
            )
        
        try:
            # anyio.fail_after handles timeouts for async/await calls cleanly
            with anyio.fail_after(timeout_seconds):
                # Call generative model inside an executor if blocking, or use async genai client if available.
                # Since model call is synchronous block, run in default thread executor to avoid blocking event loop.
                response = await anyio.to_thread.run_sync(
                    lambda: self.client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=prompt,
                        config={"system_instruction": SYSTEM_INSTRUCTION}
                    )
                )
                
                if not response or not response.text:
                    logger.error("Empty response received from Gemini API.")
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="Received empty content from AI provider."
                    )
                return response.text
                
        except TimeoutError:
            logger.error("Gemini API call timed out after %s seconds.", timeout_seconds)
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Request to Gemini AI timed out."
            )
        except ValueError as e:
            logger.error("Invalid input or configuration error: %s", str(e))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Configuration or input error: {str(e)}"
            )
        except APIError as e:
            logger.error("Gemini API error: %s", str(e))
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Google Gemini service error: {str(e)}"
            )
            
        except Exception as e:
            logger.exception("Unexpected error occurred while contacting Gemini API.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error occurred while processing AI request."
            )
