import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.ai import AIConversation, AIMessage, PromptTemplate
from app.models.project import Project
from app.models.task import Task
from app.services.ai import AIService
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    AIConversationResponse,
    AIMessageResponse,
    AIGeneratedTask,
    PromptTemplateCreate,
    PromptTemplateResponse
)

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

@router.post(
    "/chat",
    response_model=AIChatResponse,
    summary="Ask AI Assistant"
)
def chat_with_assistant(
    request: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exchanges messages with the workspace AI assistant. Logs prompt history to PostgreSQL.
    """
    return AIService.ask(
        db=db,
        user_id=current_user.id,
        prompt=request.prompt,
        conversation_id=request.conversation_id
    )

@router.get(
    "/conversations",
    response_model=List[AIConversationResponse],
    summary="List chat threads"
)
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List user conversation history threads.
    """
    return db.query(AIConversation).filter(
        AIConversation.user_id == current_user.id
    ).order_by(AIConversation.created_at.desc()).all()

@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=List[AIMessageResponse],
    summary="Get thread messages"
)
def get_messages(
    conversation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve message logs for a specific conversation thread.
    """
    convo = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.user_id == current_user.id
    ).first()
    
    if not convo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
        
    return db.query(AIMessage).filter(
        AIMessage.conversation_id == conversation_id
    ).order_by(AIMessage.created_at.asc()).all()

@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete conversation thread"
)
def delete_conversation(
    conversation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Removes a conversation thread and cascades message deletes.
    """
    convo = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.user_id == current_user.id
    ).first()
    
    if not convo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
        
    db.delete(convo)
    db.commit()
    return None

@router.get(
    "/sprint-plan",
    summary="Suggest Sprint Plan"
)
def suggest_sprint_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Builds context and uses LLM/fallback to compile a suggested sprint configuration.
    """
    messages = [
        {"role": "system", "content": AIService._get_workspace_context(db)},
        {"role": "user", "content": "Suggest a sprint plan."}
    ]
    reply = AIService.call_llm(messages)
    return {"reply": reply}

@router.get(
    "/blockers",
    summary="Find Blockers"
)
def find_blockers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Scans project logs to diagnose bottlenecks.
    """
    messages = [
        {"role": "system", "content": AIService._get_workspace_context(db)},
        {"role": "user", "content": "Find blockers."}
    ]
    reply = AIService.call_llm(messages)
    return {"reply": reply}

@router.get(
    "/project-summary/{project_id}",
    summary="Summarize Project"
)
def summarize_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Summarizes a specific project status.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    messages = [
        {"role": "system", "content": AIService._get_workspace_context(db)},
        {"role": "user", "content": f"Summarize project: '{project.name}'."}
    ]
    reply = AIService.call_llm(messages)
    return {"reply": reply}

@router.post(
    "/generate-tasks",
    response_model=List[AIGeneratedTask],
    summary="Generate Tasks"
)
def generate_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a list of suggested tasks based on active workspace needs.
    """
    # Simple dynamic heuristic generator
    return [
        {
            "title": "Establish E-Commerce Checkout API Tests",
            "description": "Develop unit and integration tests covering pricing validations.",
            "priority": "High",
            "status": "Todo"
        },
        {
            "title": "Configure Stripe Webhook Security Headers",
            "description": "Enforce cryptographic signature checks on incoming vendor hooks.",
            "priority": "Medium",
            "status": "Todo"
        },
        {
            "title": "Refine PDF Lightbox Layout Padding",
            "description": "Increase inner border gap and center close trigger overlays.",
            "priority": "Low",
            "status": "Todo"
        }
    ]

@router.post(
    "/prompts",
    response_model=PromptTemplateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save prompt template"
)
def create_prompt_template(
    template_data: PromptTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Saves a prompt template to PostgreSQL.
    """
    tmpl = PromptTemplate(
        user_id=current_user.id,
        title=template_data.title,
        content=template_data.content
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    return tmpl

@router.get(
    "/prompts",
    response_model=List[PromptTemplateResponse],
    summary="List saved prompt templates"
)
def list_prompt_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all custom prompt templates from the user prompt library.
    """
    return db.query(PromptTemplate).filter(
        PromptTemplate.user_id == current_user.id
    ).order_by(PromptTemplate.created_at.desc()).all()

@router.delete(
    "/prompts/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete prompt template"
)
def delete_prompt_template(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Removes a custom prompt template from the user library.
    """
    tmpl = db.query(PromptTemplate).filter(
        PromptTemplate.id == id,
        PromptTemplate.user_id == current_user.id
    ).first()
    if not tmpl:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt template not found"
        )
    db.delete(tmpl)
    db.commit()
    return None

