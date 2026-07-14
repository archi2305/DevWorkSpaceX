"""
AI Sprint Planner API Endpoints

REST API for AI-powered sprint planning features.
"""

import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.ai_conversation import AIConversation
from app.services.ai_sprint_planner import ai_sprint_planner

router = APIRouter(prefix="/ai/sprint-planner", tags=["AI Sprint Planner"])


# Request/Response Models
class BacklogAnalysisRequest(BaseModel):
    project_id: uuid.UUID
    sprint_id: Optional[uuid.UUID] = None


class SprintGenerationRequest(BaseModel):
    project_id: uuid.UUID
    capacity: int = Field(default=8, ge=1, le=20, description="Number of tasks for the sprint")
    sprint_duration_weeks: int = Field(default=2, ge=1, le=4, description="Sprint duration in weeks")


class StoryPointEstimationRequest(BaseModel):
    task_id: uuid.UUID


class PrioritySuggestionRequest(BaseModel):
    task_id: uuid.UUID
    context: Optional[dict] = None


class RiskIdentificationRequest(BaseModel):
    task_ids: List[uuid.UUID]


class SprintGoalGenerationRequest(BaseModel):
    task_ids: List[uuid.UUID]


class ConversationMessage(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str
    timestamp: Optional[str] = None


class SaveConversationRequest(BaseModel):
    conversation_type: str
    context: Optional[dict] = None
    messages: List[ConversationMessage]
    summary: Optional[str] = None
    tokens_used: int = 0


@router.post("/analyze-backlog", summary="Analyze project backlog")
async def analyze_backlog(
    request: BacklogAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze the current backlog and provide insights.
    Returns task distribution, priority analysis, and recommendations.
    """
    # Get tasks from project
    tasks = db.query(Task).filter(
        Task.project_id == request.project_id,
        Task.is_deleted == False,
        Task.is_archived == False
    ).all()
    
    # Convert to dict format
    task_dicts = [
        {
            'id': str(t.id),
            'title': t.title,
            'description': t.description or '',
            'priority': t.priority,
            'status': t.status,
            'completed': t.completed,
            'story_points': t.story_points
        }
        for t in tasks
    ]
    
    # Analyze backlog
    analysis = await ai_sprint_planner.analyze_backlog(task_dicts)
    
    return analysis


@router.post("/generate-sprint", summary="Generate AI-powered sprint plan")
async def generate_sprint(
    request: SprintGenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a complete sprint plan from the backlog.
    Includes task selection, story points, sprint goal, and risk analysis.
    """
    # Get pending tasks from project
    tasks = db.query(Task).filter(
        Task.project_id == request.project_id,
        Task.is_deleted == False,
        Task.is_archived == False,
        Task.completed == False
    ).all()
    
    # Convert to dict format
    task_dicts = [
        {
            'id': str(t.id),
            'title': t.title,
            'description': t.description or '',
            'priority': t.priority,
            'status': t.status,
            'story_points': t.story_points
        }
        for t in tasks
    ]
    
    # Generate sprint plan
    sprint_plan = await ai_sprint_planner.generate_sprint(task_dicts, request.capacity)
    
    return sprint_plan


@router.post("/estimate-story-points", summary="Estimate story points for a task")
async def estimate_story_points(
    request: StoryPointEstimationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get AI-estimated story points for a specific task.
    """
    task = db.query(Task).filter(Task.id == request.task_id).first()
    if not task:
        return {'error': 'Task not found'}
    
    task_dict = {
        'id': str(task.id),
        'title': task.title,
        'description': task.description or '',
        'priority': task.priority
    }
    
    estimated_points = await ai_sprint_planner.estimate_story_points(task_dict)
    
    return {
        'task_id': str(task.id),
        'estimated_story_points': estimated_points,
        'current_story_points': task.story_points
    }


@router.post("/suggest-priority", summary="Suggest priority for a task")
async def suggest_priority(
    request: PrioritySuggestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get AI-suggested priority for a task based on context.
    """
    task = db.query(Task).filter(Task.id == request.task_id).first()
    if not task:
        return {'error': 'Task not found'}
    
    task_dict = {
        'id': str(task.id),
        'title': task.title,
        'description': task.description or '',
        'priority': task.priority
    }
    
    suggested_priority = await ai_sprint_planner.suggest_priority(task_dict, request.context or {})
    
    return {
        'task_id': str(task.id),
        'suggested_priority': suggested_priority,
        'current_priority': task.priority
    }


@router.post("/identify-risks", summary="Identify sprint risks")
async def identify_risks(
    request: RiskIdentificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Identify potential risks in a set of tasks.
    """
    tasks = db.query(Task).filter(Task.id.in_(request.task_ids)).all()
    
    task_dicts = [
        {
            'id': str(t.id),
            'title': t.title,
            'description': t.description or '',
            'priority': t.priority,
            'story_points': t.story_points
        }
        for t in tasks
    ]
    
    risks = await ai_sprint_planner.identify_risks(task_dicts)
    
    return {
        'risks': risks,
        'total_risks': len(risks)
    }


@router.post("/generate-sprint-goal", summary="Generate sprint goal")
async def generate_sprint_goal(
    request: SprintGoalGenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate an AI-powered sprint goal based on selected tasks.
    """
    tasks = db.query(Task).filter(Task.id.in_(request.task_ids)).all()
    
    task_dicts = [
        {
            'id': str(t.id),
            'title': t.title,
            'description': t.description or ''
        }
        for t in tasks
    ]
    
    sprint_goal = await ai_sprint_planner.generate_sprint_goal(task_dicts)
    
    return {
        'sprint_goal': sprint_goal,
        'task_count': len(task_dicts)
    }


@router.post("/conversations", summary="Save AI conversation")
async def save_conversation(
    request: SaveConversationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Save an AI conversation to history.
    """
    conversation = AIConversation(
        user_id=current_user.id,
        conversation_type=request.conversation_type,
        context=request.context,
        messages=[msg.model_dump() for msg in request.messages],
        summary=request.summary,
        tokens_used=request.tokens_used
    )
    
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    return {
        'conversation_id': str(conversation.id),
        'created_at': conversation.created_at.isoformat()
    }


@router.get("/conversations", summary="Get user's AI conversations")
async def get_conversations(
    conversation_type: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the user's AI conversation history.
    """
    query = db.query(AIConversation).filter(AIConversation.user_id == current_user.id)
    
    if conversation_type:
        query = query.filter(AIConversation.conversation_type == conversation_type)
    
    conversations = query.order_by(AIConversation.created_at.desc()).limit(limit).all()
    
    return [
        {
            'id': str(conv.id),
            'conversation_type': conv.conversation_type,
            'context': conv.context,
            'summary': conv.summary,
            'tokens_used': conv.tokens_used,
            'created_at': conv.created_at.isoformat(),
            'updated_at': conv.updated_at.isoformat()
        }
        for conv in conversations
    ]


@router.get("/conversations/{conversation_id}", summary="Get specific conversation")
async def get_conversation(
    conversation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific AI conversation with full message history.
    """
    conversation = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        return {'error': 'Conversation not found'}
    
    return {
        'id': str(conversation.id),
        'conversation_type': conversation.conversation_type,
        'context': conversation.context,
        'messages': conversation.messages,
        'summary': conversation.summary,
        'tokens_used': conversation.tokens_used,
        'created_at': conversation.created_at.isoformat(),
        'updated_at': conversation.updated_at.isoformat()
    }
