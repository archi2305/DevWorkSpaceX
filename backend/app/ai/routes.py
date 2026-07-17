from fastapi import APIRouter, Depends, status
from app.ai.schemas import GeminiTestRequest, GeminiTestResponse
from app.ai.service import GeminiService
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/ai", tags=["AI Integration"])

def get_gemini_service() -> GeminiService:
    return GeminiService()

@router.post(
    "/test",
    response_model=GeminiTestResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify Google Gemini API integration response status"
)
async def test_gemini_integration(
    request: GeminiTestRequest,
    service: GeminiService = Depends(get_gemini_service),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint verifying successful connection to Gemini using the official google-genai library.
    Requires user authentication token in bearer headers.
    """
    reply = await service.generate_response(request.message)
    return GeminiTestResponse(reply=reply)

@router.post(
    "/test-dev",
    response_model=GeminiTestResponse,
    status_code=status.HTTP_200_OK,
    summary="[FOR DEVELOPMENT ONLY] Unauthenticated Groq verification endpoint",
    description="[FOR DEVELOPMENT ONLY] Bypasses JWT check to simplify local AI frontend integration. Will be deleted."
)
async def test_groq_dev(
    request: GeminiTestRequest,
    service: GeminiService = Depends(get_gemini_service)
):
    reply = await service.generate_response(request.message)
    return GeminiTestResponse(reply=reply)

from app.ai.schemas import ProjectPlannerRequest, ProjectPlannerResponse
from fastapi import HTTPException
from pydantic import ValidationError

@router.post(
    "/project-planner",
    response_model=ProjectPlannerResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate project plan specifications"
)
async def generate_project_plan(
    request: ProjectPlannerRequest,
    service: GeminiService = Depends(get_gemini_service)
):
    system_prompt = (
        "Generate a complete structured project plan in strictly valid JSON format. "
        "Your reply must contain ONLY a single JSON block and no additional commentary, conversational text, or markdown code blocks. "
        "The JSON object must match exactly the following structure:\n"
        "{\n"
        "  \"project_name\": \"\",\n"
        "  \"description\": \"\",\n"
        "  \"estimated_duration_weeks\": 0,\n"
        "  \"milestones\": [\n"
        "    {\n"
        "      \"title\": \"\",\n"
        "      \"description\": \"\",\n"
        "      \"tasks\": [\n"
        "        {\n"
        "          \"title\": \"\",\n"
        "          \"description\": \"\",\n"
        "          \"priority\": \"LOW | MEDIUM | HIGH\",\n"
        "          \"estimated_hours\": 0\n"
        "        }\n"
        "      ]\n"
        "    }\n"
        "  ]\n"
        "}"
    )
    
    full_prompt = f"{system_prompt}\n\nProject request spec: {request.prompt}"
    raw_reply = await service.generate_response(full_prompt)
    
    # Strip any markdown wrappers if returned by the model
    cleaned_reply = raw_reply.strip()
    if cleaned_reply.startswith("```json"):
        cleaned_reply = cleaned_reply[7:]
    elif cleaned_reply.startswith("```"):
        cleaned_reply = cleaned_reply[3:]
    if cleaned_reply.endswith("```"):
        cleaned_reply = cleaned_reply[:-3]
    cleaned_reply = cleaned_reply.strip()
    
    try:
        # Validate AI output matches the schema structure
        parsed_payload = ProjectPlannerResponse.model_validate_json(cleaned_reply)
        return parsed_payload
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider failed validation rules: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider failed to return valid project plan schema: {str(e)}"
        )
