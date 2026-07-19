from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.ai import Blueprint
from app.ai.service import GeminiService
from app.ai.schemas import ProjectPlannerRequest, ProjectPlannerResponse, CopilotChatRequest, CopilotChatResponse, AITestRequest, AITestResponse, ProjectPlanRequest, ProjectPlanResponse, MilestonePlanRequest, MilestonePlanResponse, DatabaseDesignRequest, DatabaseDesignResponse, ApiDesignRequest, ApiDesignResponse, ArchitectureRequest, ArchitectureResponse, BlueprintRequest, BlueprintResponse, ChatRequest, ChatResponse, CodeGenerationRequest, CodeGenerationResponse, BlueprintCreate, BlueprintUpdate, BlueprintResponseSchema, DocumentationRequest, DocumentationResponse, ReviewRequest, ReviewResponse
from pydantic import ValidationError
from sqlalchemy import or_, desc, asc

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
    "/project-plan",
    response_model=ProjectPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate software project plan"
)
async def generate_project_plan_endpoint(
    request: ProjectPlanRequest,
    service: GeminiService = Depends(get_gemini_service)
):
    return service.generate_project_plan(
        idea=request.idea,
        project_type=request.project_type,
        difficulty=request.difficulty,
        timeline=request.timeline,
        preferred_stack=request.preferred_stack
    )

@router.post(
    "/milestone-plan",
    response_model=MilestonePlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate detailed implementation roadmap for a single milestone"
)
async def generate_milestone_plan_endpoint(
    request: MilestonePlanRequest,
    service: GeminiService = Depends(get_gemini_service)
):
    return service.generate_milestone_plan(
        project_title=request.project_title,
        milestone=request.milestone,
        preferred_stack=request.preferred_stack
    )

@router.post(
    "/database-design",
    response_model=DatabaseDesignResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate production-ready database design"
)
async def generate_database_design_endpoint(
    request: DatabaseDesignRequest,
    service: GeminiService = Depends(get_gemini_service)
):
    return service.generate_database_design(
        project_title=request.project_title,
        description=request.description,
        preferred_database=request.preferred_database
    )

@router.post(
    "/api-design",
    response_model=ApiDesignResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate production-ready REST API specification"
)
async def generate_api_design_endpoint(
    request: ApiDesignRequest,
    service: GeminiService = Depends(get_gemini_service)
):
    return service.generate_api_design(
        project_title=request.project_title,
        description=request.description,
        database_tables=request.database_tables
    )

@router.post(
    "/architecture",
    response_model=ArchitectureResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate software architecture plan"
)
async def generate_architecture_endpoint(
    request: ArchitectureRequest,
    service: GeminiService = Depends(get_gemini_service)
):
    return service.generate_architecture(
        project_title=request.project_title,
        description=request.description,
        tech_stack=request.tech_stack,
        database_tables=request.database_tables,
        api_resources=request.api_resources
    )

@router.post(
    "/blueprint",
    response_model=BlueprintResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a complete unified software blueprint"
)
async def generate_blueprint_endpoint(
    request: BlueprintRequest,
    service: GeminiService = Depends(get_gemini_service)
):
    return service.generate_blueprint(
        idea=request.idea,
        project_type=request.project_type,
        difficulty=request.difficulty,
        timeline=request.timeline,
        preferred_stack=request.preferred_stack
    )

@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="AI Software Architect Chat"
)
async def chat_endpoint(
    request: ChatRequest,
    service: GeminiService = Depends(get_gemini_service)
):
    return service.chat(request.message, request.project_context)

@router.post(
    "/generate-code",
    response_model=CodeGenerationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate software module code"
)
async def generate_code_endpoint(
    request: CodeGenerationRequest,
    service: GeminiService = Depends(get_gemini_service)
):
    return service.generate_code(request)

@router.post(
    "/generate-docs",
    response_model=DocumentationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate software documentation file"
)
async def generate_docs_endpoint(
    request: DocumentationRequest,
    service: GeminiService = Depends(get_gemini_service)
):
    return service.generate_documentation(request)

@router.post(
    "/review",
    response_model=ReviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Review generated project specs blueprint"
)
async def generate_review_endpoint(
    request: ReviewRequest,
    service: GeminiService = Depends(get_gemini_service)
):
    return service.generate_review(request)

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

@router.post("/blueprints", response_model=BlueprintResponseSchema, status_code=status.HTTP_201_CREATED)
def create_blueprint(
    request: BlueprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    blueprint = Blueprint(
        user_id=current_user.id,
        title=request.title,
        description=request.description,
        status=request.status or "Draft",
        overview=request.overview,
        tech_stack=request.tech_stack,
        features=request.features,
        database_design=request.database_design,
        api_design=request.api_design,
        architecture=request.architecture,
        milestones=request.milestones,
        generated_code=request.generated_code,
        chat_history=request.chat_history,
        metadata_info=request.metadata_info
    )
    db.add(blueprint)
    db.commit()
    db.refresh(blueprint)
    return blueprint

@router.get("/blueprints", response_model=List[BlueprintResponseSchema])
def list_blueprints(
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort: Optional[str] = "newest",
    include_archived: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Blueprint).filter(Blueprint.user_id == current_user.id)
    
    if not include_archived:
        query = query.filter(Blueprint.is_archived == False)

    if status:
        query = query.filter(Blueprint.status == status)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Blueprint.title.ilike(search_filter),
                Blueprint.description.ilike(search_filter),
                Blueprint.status.ilike(search_filter)
            )
        )

    if sort == "oldest":
        query = query.order_by(asc(Blueprint.created_at))
    elif sort == "recently_modified":
        query = query.order_by(desc(Blueprint.updated_at))
    else:
        query = query.order_by(desc(Blueprint.created_at))

    return query.all()

@router.get("/blueprints/{blueprint_id}", response_model=BlueprintResponseSchema)
def get_blueprint_detail(
    blueprint_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    blueprint = db.query(Blueprint).filter(
        Blueprint.id == blueprint_id,
        Blueprint.user_id == current_user.id
    ).first()
    if not blueprint:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    return blueprint

@router.put("/blueprints/{blueprint_id}", response_model=BlueprintResponseSchema)
def update_blueprint(
    blueprint_id: uuid.UUID,
    request: BlueprintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    blueprint = db.query(Blueprint).filter(
        Blueprint.id == blueprint_id,
        Blueprint.user_id == current_user.id
    ).first()
    if not blueprint:
        raise HTTPException(status_code=404, detail="Blueprint not found")

    update_data = request.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(blueprint, key, val)

    db.commit()
    db.refresh(blueprint)
    return blueprint

@router.post("/blueprints/{blueprint_id}/duplicate", response_model=BlueprintResponseSchema)
def duplicate_blueprint(
    blueprint_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    blueprint = db.query(Blueprint).filter(
        Blueprint.id == blueprint_id,
        Blueprint.user_id == current_user.id
    ).first()
    if not blueprint:
        raise HTTPException(status_code=404, detail="Blueprint not found")

    duplicated = Blueprint(
        user_id=current_user.id,
        title=f"{blueprint.title} (Copy)",
        description=blueprint.description,
        status="Draft",
        overview=blueprint.overview,
        tech_stack=blueprint.tech_stack,
        features=blueprint.features,
        database_design=blueprint.database_design,
        api_design=blueprint.api_design,
        architecture=blueprint.architecture,
        milestones=blueprint.milestones,
        generated_code=blueprint.generated_code,
        chat_history=blueprint.chat_history,
        metadata_info=blueprint.metadata_info
    )
    db.add(duplicated)
    db.commit()
    db.refresh(duplicated)
    return duplicated

@router.delete("/blueprints/{blueprint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_blueprint(
    blueprint_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    blueprint = db.query(Blueprint).filter(
        Blueprint.id == blueprint_id,
        Blueprint.user_id == current_user.id
    ).first()
    if not blueprint:
        raise HTTPException(status_code=404, detail="Blueprint not found")

    db.delete(blueprint)
    db.commit()
    return None
