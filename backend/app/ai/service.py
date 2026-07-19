import logging
import json
from groq import Groq
from fastapi import HTTPException, status
from app.core.config import settings
from app.ai.schemas import ProjectPlanResponse

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        
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

    def generate_project_plan(self, idea: str) -> ProjectPlanResponse:
        """
        Generate a project plan using the Groq model and return a validated ProjectPlanResponse.
        """
        if not self.api_key or not self.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq API is not configured or missing a valid API key on this server."
            )
        
        system_instruction = (
            "You are a senior software architect. Generate a project plan for the provided project idea. "
            "You must return ONLY valid JSON with exactly the following structure:\n"
            "{\n"
            "  \"title\": \"...\",\n"
            "  \"description\": \"...\",\n"
            "  \"features\": [\"...\"],\n"
            "  \"tech_stack\": {\n"
            "    \"frontend\": \"...\",\n"
            "    \"backend\": \"...\",\n"
            "    \"database\": \"...\"\n"
            "  },\n"
            "  \"milestones\": [\"...\"],\n"
            "  \"tasks\": [\n"
            "    {\n"
            "      \"title\": \"...\",\n"
            "      \"description\": \"...\",\n"
            "      \"priority\": \"High\"\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "Do not allow markdown. Do not allow explanations. Do not wrap JSON inside ``` blocks."
        )
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": f"Project idea: {idea}"}
                ],
                response_format={"type": "json_object"},
                temperature=0
            )
            
            if not response or not response.choices or not response.choices[0].message.content:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Received empty content from Groq AI provider during project planning."
                )
                
            raw_reply = response.choices[0].message.content
            
            try:
                parsed_json = json.loads(raw_reply)
            except json.JSONDecodeError as decode_err:
                logger.error("Groq returned invalid JSON string: %s. Error: %s", raw_reply, str(decode_err))
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Groq API returned invalid JSON: {str(decode_err)}"
                )
            
            try:
                validated_response = ProjectPlanResponse.model_validate(parsed_json)
                return validated_response
            except Exception as val_err:
                logger.error("Pydantic validation failed for project plan: %s. Raw: %s", str(val_err), raw_reply)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to validate generated project plan JSON schema: {str(val_err)}"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Error calling Groq model for project plan generation.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error contacting Groq AI during project planning: {str(e)}"
            )

# Compatibility aliases for existing project router
GeminiService = AIService
