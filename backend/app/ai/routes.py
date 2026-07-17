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
