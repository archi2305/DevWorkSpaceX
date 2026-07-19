from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class AITestRequest(BaseModel):
    prompt: str = Field(..., description="Prompt payload for AI integration test")

class AITestResponse(BaseModel):
    reply: str = Field(..., description="Reply text from the Groq model")

class TaskPlan(BaseModel):
    title: str = Field(..., description="Task title")
    description: str = Field(..., description="Task description")
    priority: Literal["LOW", "MEDIUM", "HIGH"] = Field(..., description="Task priority")
    estimated_hours: int = Field(..., description="Estimated hours to complete")

class MilestonePlan(BaseModel):
    title: str = Field(..., description="Milestone title")
    description: str = Field(..., description="Milestone description")
    acceptance_criteria: str = Field(..., description="Acceptance criteria for this milestone")
    tasks: List[TaskPlan] = Field(..., description="Tasks list inside milestone")

class ProjectPlannerRequest(BaseModel):
    prompt: str = Field(..., description="Project specification to generate a plan for")
    project_type: Optional[str] = Field(None, description="Type of project")
    difficulty: Optional[str] = Field(None, description="Project implementation difficulty")
    timeline: Optional[str] = Field(None, description="Timeline estimation")
    team_size: Optional[str] = Field(None, description="Size of project team")
    tech_stack: Optional[str] = Field(None, description="Preferred technology stack")

class ProjectPlannerResponse(BaseModel):
    project_name: str = Field(..., description="Generated project name")
    description: str = Field(..., description="Generated project description")
    estimated_duration_weeks: int = Field(..., description="Estimated total duration in weeks")
    milestones: List[MilestonePlan] = Field(..., description="Key project milestones")
    recommended_tech_stack: List[str] = Field(..., description="Recommended technology stack")
    folder_structure: str = Field(..., description="Recommended project directory folder structure")
    architecture_style: str = Field(..., description="Recommended architecture style (e.g. MVC, Microservices)")
    recommended_database: str = Field(..., description="Recommended database technology")
    auth_strategy: str = Field(..., description="Recommended user authentication strategy")
    deployment_suggestion: str = Field(..., description="Recommended cloud deployment strategy")
    testing_strategy: str = Field(..., description="Recommended testing approach")
    potential_risks: List[str] = Field(..., description="List of potential project implementation risks")
    final_deliverables: List[str] = Field(..., description="Key final deliverables list")

class CopilotChatRequest(BaseModel):
    current_project: dict = Field(..., description="Current local JSON state of the project")
    message: str = Field(..., description="Natural language instructions/query for changes")

class CopilotChatResponse(BaseModel):
    updated_project: dict = Field(..., description="Updated JSON state of the project following chat refinement")

class ProjectPlanRequest(BaseModel):
    idea: str = Field(..., description="The project idea prompt description")
    project_type: str = Field(..., description="Type of project")
    difficulty: str = Field(..., description="Project implementation difficulty")
    timeline: str = Field(..., description="Timeline estimation")
    preferred_stack: Optional[str] = Field(None, description="Preferred technology stack")

class TechStack(BaseModel):
    frontend: str = Field(..., description="Frontend framework/library name")
    backend: str = Field(..., description="Backend framework/library name")
    database: str = Field(..., description="Database management system name")

class ProjectTask(BaseModel):
    title: str = Field(..., description="Task title")
    description: str = Field(..., description="Task description detail")
    priority: str = Field(..., description="Task priority value")

class ProjectPlanResponse(BaseModel):
    title: str = Field(..., description="Proposed project title")
    description: str = Field(..., description="Detailed project description")
    features: List[str] = Field(..., description="Key features included in the plan")
    tech_stack: TechStack = Field(..., description="Recommended technology stack")
    milestones: List[str] = Field(..., description="Key milestones listed for delivery")
    tasks: List[ProjectTask] = Field(..., description="Detailed tasks required for the project")
