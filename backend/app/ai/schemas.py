from pydantic import BaseModel, Field

class GeminiTestRequest(BaseModel):
    message: str = Field(..., description="Message payload to send to Google Gemini LLM")

class GeminiTestResponse(BaseModel):
    reply: str = Field(..., description="Text response reply from the LLM model")

from typing import List, Literal

class TaskPlan(BaseModel):
    title: str = Field(..., description="Task title")
    description: str = Field(..., description="Task description")
    priority: Literal["LOW", "MEDIUM", "HIGH"] = Field(..., description="Task priority")
    estimated_hours: int = Field(..., description="Estimated hours to complete")

class MilestonePlan(BaseModel):
    title: str = Field(..., description="Milestone title")
    description: str = Field(..., description="Milestone description")
    tasks: List[TaskPlan] = Field(..., description="Tasks list inside milestone")

class ProjectPlannerRequest(BaseModel):
    prompt: str = Field(..., description="Project specification to generate a plan for")

class ProjectPlannerResponse(BaseModel):
    project_name: str = Field(..., description="Generated project name")
    description: str = Field(..., description="Generated project description")
    estimated_duration_weeks: int = Field(..., description="Estimated total duration in weeks")
    milestones: List[MilestonePlan] = Field(..., description="Key project milestones")
