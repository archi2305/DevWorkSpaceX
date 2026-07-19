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

class MilestonePlanRequest(BaseModel):
    project_title: str = Field(..., description="The title of the project")
    milestone: str = Field(..., description="The milestone name to plan for")
    preferred_stack: Optional[str] = Field(None, description="Preferred technology stack")

class ImplementationTask(BaseModel):
    title: str = Field(..., description="Task title")
    description: str = Field(..., description="Detailed task description")
    priority: str = Field(..., description="Task priority (High, Medium, Low)")
    estimated_hours: int = Field(..., description="Estimated hours to complete")

class MilestonePlanResponse(BaseModel):
    milestone: str = Field(..., description="Planned milestone name")
    overview: str = Field(..., description="Milestone overview and description")
    subtasks: List[ImplementationTask] = Field(..., description="List of implementation subtasks")
    api_endpoints: List[str] = Field(..., description="List of required API endpoints")
    database_tables: List[str] = Field(..., description="List of database tables involved")
    folder_structure: str = Field(..., description="Proposed files and folder structure path list")

class DatabaseDesignRequest(BaseModel):
    project_title: str = Field(..., description="The title of the project")
    description: str = Field(..., description="Detailed description of the project and its data needs")
    preferred_database: Optional[str] = Field(None, description="Preferred database technology")

class DatabaseColumn(BaseModel):
    name: str = Field(..., description="Column name")
    type: str = Field(..., description="Column data type")
    primary_key: bool = Field(..., description="Whether this column is a primary key")
    nullable: bool = Field(..., description="Whether this column allows null values")
    unique: bool = Field(..., description="Whether this column values must be unique")

class DatabaseTable(BaseModel):
    name: str = Field(..., description="Table name")
    description: str = Field(..., description="Description of the table purpose")
    columns: List[DatabaseColumn] = Field(..., description="List of columns in this table")

class Relationship(BaseModel):
    from_table: str = Field(..., description="Origin table name")
    to_table: str = Field(..., description="Destination table name")
    relationship_type: str = Field(..., description="Type of relationship (e.g. One-to-Many, Many-to-Many)")

class DatabaseDesignResponse(BaseModel):
    database: str = Field(..., description="Selected database name")
    tables: List[DatabaseTable] = Field(..., description="List of tables in the design")
    relationships: List[Relationship] = Field(..., description="List of relationships between tables")
    indexes: List[str] = Field(..., description="List of recommended indexes")

class ApiDesignRequest(BaseModel):
    project_title: str = Field(..., description="The title of the project")
    description: str = Field(..., description="Detailed description of the project and its API needs")
    database_tables: List[str] = Field(..., description="List of database tables involved")

class ApiEndpoint(BaseModel):
    method: str = Field(..., description="HTTP Method (GET, POST, PUT, DELETE, etc.)")
    path: str = Field(..., description="Endpoint path URL")
    description: str = Field(..., description="Endpoint purpose and action description")

class ApiResource(BaseModel):
    name: str = Field(..., description="Resource name (e.g. Products, Users)")
    endpoints: List[ApiEndpoint] = Field(..., description="Endpoints exposed by this resource")

class AuthenticationEndpoint(BaseModel):
    method: str = Field(..., description="HTTP Method (GET, POST, etc.)")
    path: str = Field(..., description="Endpoint path URL")
    description: str = Field(..., description="Endpoint description")

class AuthenticationDesign(BaseModel):
    login: AuthenticationEndpoint = Field(..., description="Login endpoint specification")
    register: AuthenticationEndpoint = Field(..., description="Registration endpoint specification")

class ApiDesignResponse(BaseModel):
    base_url: str = Field(..., description="Proposed Base API URL path")
    resources: List[ApiResource] = Field(..., description="List of resources exposed by this API")
    authentication: AuthenticationDesign = Field(..., description="Proposed authentication mechanisms details")
    request_examples: dict = Field(..., description="Map of endpoint request payload examples")
    response_examples: dict = Field(..., description="Map of endpoint response payload examples")
    status_codes: List[int] = Field(..., description="List of HTTP status codes returned by this API")

class ArchitectureRequest(BaseModel):
    project_title: str = Field(..., description="The title of the project")
    description: str = Field(..., description="Detailed description of the project and its overall architectural goals")
    tech_stack: TechStack = Field(..., description="Recommended technology stack")
    database_tables: List[str] = Field(..., description="List of database tables involved")
    api_resources: List[str] = Field(..., description="List of REST API resource names")

class ArchitectureFolderStructure(BaseModel):
    backend: List[str] = Field(..., description="List of proposed backend project files/directories")
    frontend: List[str] = Field(..., description="List of proposed frontend project files/directories")

class ArchitectureResponse(BaseModel):
    architecture_style: str = Field(..., description="Name of the selected architecture style (e.g. Clean Architecture, Monolith)")
    modules: List[str] = Field(..., description="List of proposed core application modules")
    folder_structure: ArchitectureFolderStructure = Field(..., description="Proposed directory layout structure")
    external_services: List[str] = Field(..., description="List of external services integrated (e.g. SendGrid, Stripe)")
    communication: str = Field(..., description="Detailed description of components communication flow")

class BlueprintRequest(BaseModel):
    idea: str = Field(..., description="The project idea prompt description")
    project_type: str = Field(..., description="Type of project")
    difficulty: str = Field(..., description="Project implementation difficulty")
    timeline: str = Field(..., description="Timeline estimation")
    preferred_stack: Optional[str] = Field(None, description="Preferred technology stack")

class BlueprintResponse(BaseModel):
    project_plan: ProjectPlanResponse = Field(..., description="Generated base project plan")
    milestone_plan: MilestonePlanResponse = Field(..., description="Generated implementation details for first milestone")
    database_design: DatabaseDesignResponse = Field(..., description="Generated database structure design")
    api_design: ApiDesignResponse = Field(..., description="Generated REST API contract specification")
    architecture: ArchitectureResponse = Field(..., description="Generated systems architectural components layouts")

class ChatRequest(BaseModel):
    message: str = Field(..., description="User query message to the AI Architect")

class ChatResponse(BaseModel):
    reply: str = Field(..., description="Response reply from the AI Architect")
