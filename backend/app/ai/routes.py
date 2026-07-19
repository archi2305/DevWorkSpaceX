from fastapi import APIRouter, Depends, status
from app.ai.service import GeminiService
from app.ai.schemas import ProjectPlannerRequest, ProjectPlannerResponse, CopilotChatRequest, CopilotChatResponse, AITestRequest, AITestResponse
from fastapi import HTTPException
from pydantic import ValidationError

router = APIRouter(prefix="/api/ai", tags=["AI Integration"])

def get_gemini_service() -> GeminiService:
    return GeminiService()

@router.post(
    "/test",
    response_model=AITestResponse,
    status_code=status.HTTP_200_OK,
    summary="Minimal AI test endpoint"
)
async def test_ai_integration(
    request: AITestRequest,
    service: GeminiService = Depends(get_gemini_service)
):
    reply = service.generate(request.prompt)
    return AITestResponse(reply=reply)

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
    # Dynamic prompt building based on configurations
    config_details = []
    if request.project_type:
        config_details.append(f"- Project Type: {request.project_type}")
    if request.difficulty:
        config_details.append(f"- Target Difficulty: {request.difficulty}")
    if request.timeline:
        config_details.append(f"- Target Timeline: {request.timeline}")
    if request.team_size:
        config_details.append(f"- Team Size: {request.team_size}")
    if request.tech_stack:
        config_details.append(f"- Preferred Technologies: {request.tech_stack}")
        
    config_context = "\n".join(config_details)

    system_prompt = (
        "Generate a complete structured project plan in strictly valid JSON format. "
        "Your reply must contain ONLY a single JSON block and no additional commentary, conversational text, or markdown code blocks. "
        "The JSON object must match exactly the following structure:\n"
        "{\n"
        "  \"project_name\": \"\",\n"
        "  \"description\": \"\",\n"
        "  \"estimated_duration_weeks\": 0,\n"
        "  \"recommended_tech_stack\": [\"\", \"\"],\n"
        "  \"folder_structure\": \"\",\n"
        "  \"architecture_style\": \"\",\n"
        "  \"recommended_database\": \"\",\n"
        "  \"auth_strategy\": \"\",\n"
        "  \"deployment_suggestion\": \"\",\n"
        "  \"testing_strategy\": \"\",\n"
        "  \"potential_risks\": [\"\", \"\"],\n"
        "  \"final_deliverables\": [\"\", \"\"],\n"
        "  \"milestones\": [\n"
        "    {\n"
        "      \"title\": \"\",\n"
        "      \"description\": \"\",\n"
        "      \"acceptance_criteria\": \"\",\n"
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
    
    full_prompt = f"{system_prompt}\n\nProject request spec: {request.prompt}\n\nConfiguration constraints:\n{config_context}"
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

@router.post(
    "/copilot-chat",
    response_model=CopilotChatResponse,
    status_code=status.HTTP_200_OK,
    summary="[FOR DEVELOPMENT ONLY] Refine project structure interactively",
    description="Updates the project plan JSON based on user chat commands."
)
async def copilot_chat_refinement(
    request: CopilotChatRequest,
    service: GeminiService = Depends(get_gemini_service)
):
    system_prompt = (
        "You are an AI Project Copilot. You receive a project plan JSON state and a user refinement instruction. "
        "Apply the requested modification, update/restructure the JSON, and return the modified JSON matching the exact schema configuration: "
        "{\n"
        "  \"project_name\": \"\",\n"
        "  \"description\": \"\",\n"
        "  \"estimated_duration_weeks\": 0,\n"
        "  \"recommended_tech_stack\": [\"\", \"\"],\n"
        "  \"folder_structure\": \"\",\n"
        "  \"architecture_style\": \"\",\n"
        "  \"recommended_database\": \"\",\n"
        "  \"auth_strategy\": \"\",\n"
        "  \"deployment_suggestion\": \"\",\n"
        "  \"testing_strategy\": \"\",\n"
        "  \"potential_risks\": [\"\", \"\"],\n"
        "  \"final_deliverables\": [\"\", \"\"],\n"
        "  \"milestones\": [\n"
        "    {\n"
        "      \"title\": \"\",\n"
        "      \"description\": \"\",\n"
        "      \"acceptance_criteria\": \"\",\n"
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
        "}\n"
        "Return ONLY strictly valid JSON. Do not return conversational text or comments."
    )
    
    full_prompt = f"{system_prompt}\n\nCurrent Project State:\n{request.current_project}\n\nRefinement Request: {request.message}"
    raw_reply = await service.generate_response(full_prompt)
    
    cleaned_reply = raw_reply.strip()
    if cleaned_reply.startswith("```json"):
        cleaned_reply = cleaned_reply[7:]
    elif cleaned_reply.startswith("```"):
        cleaned_reply = cleaned_reply[3:]
    if cleaned_reply.endswith("```"):
        cleaned_reply = cleaned_reply[:-3]
    cleaned_reply = cleaned_reply.strip()
    
    try:
        # Verify it can be parsed as a dictionary matching the schema format
        import json
        updated_dict = json.loads(cleaned_reply)
        return CopilotChatResponse(updated_project=updated_dict)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to parse copilot response: {str(e)}"
        )
