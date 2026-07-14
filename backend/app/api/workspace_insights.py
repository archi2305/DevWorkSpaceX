"""
Workspace Insights API Endpoints

REST API for AI-generated workspace insights.
All calculations are dynamic based on current workspace data.
"""

import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.sprint import Sprint
from app.services.workspace_insights import workspace_insights

router = APIRouter(prefix="/workspace/insights", tags=["Workspace Insights"])


@router.get("/all", summary="Get comprehensive workspace insights")
async def get_all_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all workspace insights including project risks, blocked tasks, 
    slow progress, member workload, sprint predictions, and completion forecasts.
    """
    # Get all workspace data
    projects = db.query(Project).filter(
        (Project.owner_id == current_user.id) | (Project.members.any(id=current_user.id)),
        Project.is_deleted == False
    ).all()
    
    tasks = db.query(Task).filter(Task.is_deleted == False).all()
    
    sprints = db.query(Sprint).filter(Sprint.is_archived == False).all()
    
    users = db.query(User).all()
    
    # Convert to dict format
    project_dicts = [
        {
            'id': str(p.id),
            'name': p.name,
            'progress': p.progress,
            'total_tasks': len([t for t in tasks if t.project_id == p.id]),
            'overdue_tasks': len([
                t for t in tasks 
                if t.project_id == p.id and t.due_date and not t.completed
            ]),
            'due_date': p.due_date.isoformat() if p.due_date else None
        }
        for p in projects
    ]
    
    task_dicts = [
        {
            'id': str(t.id),
            'title': t.title,
            'project_id': str(t.project_id),
            'sprint_id': str(t.sprint_id) if t.sprint_id else None,
            'assignee_id': str(t.assignee_id) if t.assignee_id else None,
            'status': t.status,
            'completed': t.completed,
            'story_points': t.story_points,
            'due_date': t.due_date.isoformat() if t.due_date else None,
            'created_at': t.created_at.isoformat(),
            'updated_at': t.updated_at.isoformat(),
            'dependencies': []  # Would need to query TaskDependency model
        }
        for t in tasks
    ]
    
    sprint_dicts = [
        {
            'id': str(s.id),
            'name': s.name,
            'start_date': s.start_date.isoformat() if s.start_date else None,
            'end_date': s.end_date.isoformat() if s.end_date else None,
            'created_at': s.created_at.isoformat()
        }
        for s in sprints
    ]
    
    user_dicts = [
        {
            'id': str(u.id),
            'full_name': u.full_name,
            'email': u.email
        }
        for u in users
    ]
    
    # Get comprehensive insights
    insights = await workspace_insights.get_all_insights(
        project_dicts,
        task_dicts,
        sprint_dicts,
        user_dicts
    )
    
    return insights


@router.get("/project-risks", summary="Get project risk analysis")
async def get_project_risks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze project risks based on progress, overdue tasks, and capacity.
    """
    projects = db.query(Project).filter(
        (Project.owner_id == current_user.id) | (Project.members.any(id=current_user.id)),
        Project.is_deleted == False
    ).all()
    
    tasks = db.query(Task).filter(Task.is_deleted == False).all()
    
    project_dicts = [
        {
            'id': str(p.id),
            'name': p.name,
            'progress': p.progress,
            'total_tasks': len([t for t in tasks if t.project_id == p.id]),
            'overdue_tasks': len([
                t for t in tasks 
                if t.project_id == p.id and t.due_date and not t.completed
            ])
        }
        for p in projects
    ]
    
    risks = await workspace_insights.get_project_risks(project_dicts)
    
    return {
        'risks': risks,
        'total_risks': len(risks)
    }


@router.get("/blocked-tasks", summary="Get blocked tasks")
async def get_blocked_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Identify tasks that are blocked by dependencies, status, or overdue.
    """
    tasks = db.query(Task).filter(Task.is_deleted == False).all()
    
    task_dicts = [
        {
            'id': str(t.id),
            'title': t.title,
            'project_id': str(t.project_id),
            'status': t.status,
            'completed': t.completed,
            'due_date': t.due_date.isoformat() if t.due_date else None,
            'updated_at': t.updated_at.isoformat(),
            'created_at': t.created_at.isoformat(),
            'dependencies': []
        }
        for t in tasks
    ]
    
    blocked_tasks = await workspace_insights.get_blocked_tasks(task_dicts)
    
    return {
        'blocked_tasks': blocked_tasks,
        'total_blocked': len(blocked_tasks)
    }


@router.get("/slow-progress", summary="Get slow progress projects")
async def get_slow_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Identify projects with slow progress based on velocity calculations.
    """
    projects = db.query(Project).filter(
        (Project.owner_id == current_user.id) | (Project.members.any(id=current_user.id)),
        Project.is_deleted == False
    ).all()
    
    tasks = db.query(Task).filter(Task.is_deleted == False).all()
    
    project_dicts = [
        {
            'id': str(p.id),
            'name': p.name
        }
        for p in projects
    ]
    
    task_dicts = [
        {
            'id': str(t.id),
            'project_id': str(t.project_id),
            'completed': t.completed,
            'completed_at': t.updated_at.isoformat() if t.completed else None,
            'updated_at': t.updated_at.isoformat()
        }
        for t in tasks
    ]
    
    slow_projects = await workspace_insights.get_slow_progress(project_dicts, task_dicts)
    
    return {
        'slow_projects': slow_projects,
        'total_slow_projects': len(slow_projects)
    }


@router.get("/member-workload", summary="Get member workload analysis")
async def get_member_workload(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze workload distribution across team members.
    """
    tasks = db.query(Task).filter(Task.is_deleted == False).all()
    users = db.query(User).all()
    
    task_dicts = [
        {
            'id': str(t.id),
            'assignee_id': str(t.assignee_id) if t.assignee_id else None,
            'completed': t.completed,
            'story_points': t.story_points,
            'due_date': t.due_date.isoformat() if t.due_date else None
        }
        for t in tasks
    ]
    
    user_dicts = [
        {
            'id': str(u.id),
            'full_name': u.full_name,
            'email': u.email
        }
        for u in users
    ]
    
    workload = await workspace_insights.get_member_workload(task_dicts, user_dicts)
    
    return {
        'workload': workload,
        'total_members': len(workload)
    }


@router.get("/sprint-predictions", summary="Get sprint completion predictions")
async def get_sprint_predictions(
    sprint_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Predict sprint completion based on current progress and velocity.
    """
    sprints = db.query(Sprint).filter(Sprint.is_archived == False).all()
    
    if sprint_id:
        sprints = [s for s in sprints if s.id == sprint_id]
    
    tasks = db.query(Task).filter(Task.is_deleted == False).all()
    
    task_dicts = [
        {
            'id': str(t.id),
            'sprint_id': str(t.sprint_id) if t.sprint_id else None,
            'completed': t.completed,
            'story_points': t.story_points,
            'completed_at': t.updated_at.isoformat() if t.completed else None
        }
        for t in tasks
    ]
    
    predictions = []
    for sprint in sprints:
        sprint_dict = {
            'id': str(sprint.id),
            'name': sprint.name,
            'start_date': sprint.start_date.isoformat() if sprint.start_date else None,
            'end_date': sprint.end_date.isoformat() if sprint.end_date else None,
            'created_at': sprint.created_at.isoformat()
        }
        
        prediction = await workspace_insights.get_sprint_prediction(sprint_dict, task_dicts)
        predictions.append(prediction)
    
    return {
        'predictions': predictions,
        'total_predictions': len(predictions)
    }


@router.get("/completion-forecast", summary="Get project completion forecasts")
async def get_completion_forecast(
    project_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Forecast project completion dates based on current velocity and progress.
    """
    projects = db.query(Project).filter(
        (Project.owner_id == current_user.id) | (Project.members.any(id=current_user.id)),
        Project.is_deleted == False
    ).all()
    
    if project_id:
        projects = [p for p in projects if p.id == project_id]
    
    tasks = db.query(Task).filter(Task.is_deleted == False).all()
    
    project_dicts = [
        {
            'id': str(p.id),
            'name': p.name,
            'due_date': p.due_date.isoformat() if p.due_date else None
        }
        for p in projects
    ]
    
    task_dicts = [
        {
            'id': str(t.id),
            'project_id': str(t.project_id),
            'completed': t.completed,
            'story_points': t.story_points,
            'completed_at': t.updated_at.isoformat() if t.completed else None
        }
        for t in tasks
    ]
    
    forecasts = await workspace_insights.get_completion_forecast(project_dicts, task_dicts)
    
    return {
        'forecasts': forecasts,
        'total_forecasts': len(forecasts)
    }
