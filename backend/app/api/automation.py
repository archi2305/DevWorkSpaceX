import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.automation_rule import AutomationRule
from app.models.task import Task
from app.models.sprint import Sprint
from app.models.activity import ActivityLog
from app.models.notification import Notification
from app.schemas.automation_rule import (
    AutomationRuleCreate,
    AutomationRuleUpdate,
    AutomationRuleResponse
)

router = APIRouter(prefix="/automations", tags=["Automation Rules"])

@router.post(
    "",
    response_model=AutomationRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new workflow automation rule"
)
def create_automation_rule(
    request: AutomationRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rule = AutomationRule(
        project_id=request.project_id,
        name=request.name,
        trigger_event=request.trigger_event,
        action_type=request.action_type,
        action_target=request.action_target,
        is_active=request.is_active
    )
    db.add(rule)
    
    # Log Activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Automation Created",
        details=f"Created automation rule '{rule.name}'",
        target_type="Automation",
        target_name=rule.name
    )
    db.add(db_log)
    db.commit()
    db.refresh(rule)
    return rule

@router.get(
    "",
    response_model=List[AutomationRuleResponse],
    summary="List all automation rules in a project"
)
def list_automation_rules(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(AutomationRule).filter(AutomationRule.project_id == project_id).all()

@router.patch(
    "/{id}",
    response_model=AutomationRuleResponse,
    summary="Update automation rule active status"
)
def update_automation_rule(
    id: uuid.UUID,
    request: AutomationRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rule = db.query(AutomationRule).filter(AutomationRule.id == id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation rule not found."
        )

    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rule, key, value)
        
    rule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rule)
    return rule

@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an automation rule"
)
def delete_automation_rule(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rule = db.query(AutomationRule).filter(AutomationRule.id == id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation rule not found."
        )
        
    db.delete(rule)
    db.commit()
    return None

@router.post(
    "/trigger/due-dates",
    summary="Manually trigger due date automation validation rules"
)
def trigger_due_date_automations(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Scans for tasks whose due dates have passed and creates notifications if a rule is active.
    """
    rules = db.query(AutomationRule).filter(
        AutomationRule.project_id == project_id,
        AutomationRule.trigger_event == "due_date_passed",
        AutomationRule.is_active == True
    ).all()
    
    if not rules:
        return {"message": "No active due date automation rules found.", "triggered_count": 0}
        
    # Find past due tasks
    now = datetime.utcnow()
    tasks = db.query(Task).filter(
        Task.project_id == project_id,
        Task.due_date < now,
        Task.completed == False
    ).all()
    
    triggered_count = 0
    for task in tasks:
        for rule in rules:
            if rule.action_type == "notify_owner":
                # Create notification for owner/creator
                project_owner_id = task.project.owner_id
                notif = Notification(
                    user_id=project_owner_id,
                    title="Task Due Date Passed",
                    message=f"Automation '{rule.name}' triggered: Task '{task.title}' has passed its due date.",
                    type="system"
                )
                db.add(notif)
                triggered_count += 1
                
    db.commit()
    return {"message": f"Successfully processed due date rules.", "triggered_count": triggered_count}
