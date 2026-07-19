import logging
import json
from typing import Optional
from groq import Groq
from fastapi import HTTPException, status
from app.core.config import settings
from app.ai.schemas import ProjectPlanResponse, MilestonePlanResponse, DatabaseDesignResponse, ApiDesignResponse, ArchitectureResponse, TechStack, BlueprintResponse, ChatResponse, CodeGenerationRequest, CodeGenerationResponse, DocumentationRequest, DocumentationResponse, ReviewRequest, ReviewResponse

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        
        if not self.api_key:
            logger.warning("GROQ_API_KEY is not set in environment variables.")
            self.client = None
        else:
            try:
                self.client = Groq(api_key=self.api_key)
            except Exception as e:
                logger.error("Failed to initialize Groq Client: %s", str(e))
                self.client = None

    def generate(self, prompt: str) -> str:
        """
        Synchronously call the configured Groq model and return response text.
        """
        if not self.api_key or not self.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq API is not configured or missing a valid API key on this server."
            )
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            if not response or not response.choices or not response.choices[0].message.content:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Received empty content from Groq AI provider."
                )
            return response.choices[0].message.content
        except Exception as e:
            logger.exception("Error during Groq AI generation.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error contacting Groq AI: {str(e)}"
            )

    async def generate_response(self, prompt: str) -> str:
        """
        Async compatibility wrapper for generate.
        """
        return self.generate(prompt)

    def generate_project_plan(
        self, 
        idea: str, 
        project_type: str, 
        difficulty: str, 
        timeline: str, 
        preferred_stack: Optional[str] = None
    ) -> ProjectPlanResponse:
        """
        Generate a project plan using the Groq model and return a validated ProjectPlanResponse.
        """
        if not self.api_key or not self.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq API is not configured or missing a valid API key on this server."
            )
        
        system_instruction = (
            "You are a senior software architect. Generate a complete software project plan. "
            "Respect ALL constraints when generating the plan. "
            "If a preferred stack is provided: DO NOT replace it with another stack. Recommend technologies compatible with it.\n\n"
            "You must return ONLY valid JSON with exactly the following structure:\n"
            "{\n"
            "  \"title\": \"...\",\n"
            "  \"description\": \"...\",\n"
            "  \"features\": [\"...\"],\n"
            "  \"tech_stack\": {\n"
            "    \"frontend\": \"...\",\n"
            "    \"backend\": \"...\",\n"
            "    \"database\": \"...\"\n"
            "  },\n"
            "  \"milestones\": [\"...\"],\n"
            "  \"tasks\": [\n"
            "    {\n"
            "      \"title\": \"...\",\n"
            "      \"description\": \"...\",\n"
            "      \"priority\": \"High\"\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "Do not allow markdown. Do not allow explanations. Do not wrap JSON inside ``` blocks."
        )

        user_content = (
            f"Project Idea:\n{idea}\n\n"
            f"Project Type:\n{project_type}\n\n"
            f"Difficulty:\n{difficulty}\n\n"
            f"Timeline:\n{timeline}\n\n"
        )
        if preferred_stack:
            user_content += f"Preferred Stack:\n{preferred_stack}\n\n"
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_content}
                ],
                response_format={"type": "json_object"},
                temperature=0
            )
            
            if not response or not response.choices or not response.choices[0].message.content:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Received empty content from Groq AI provider during project planning."
                )
                
            raw_reply = response.choices[0].message.content
            
            try:
                parsed_json = json.loads(raw_reply)
            except json.JSONDecodeError as decode_err:
                logger.error("Groq returned invalid JSON string: %s. Error: %s", raw_reply, str(decode_err))
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Groq API returned invalid JSON: {str(decode_err)}"
                )
            
            try:
                validated_response = ProjectPlanResponse.model_validate(parsed_json)
                return validated_response
            except Exception as val_err:
                logger.error("Pydantic validation failed for project plan: %s. Raw: %s", str(val_err), raw_reply)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to validate generated project plan JSON schema: {str(val_err)}"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Error calling Groq model for project plan generation.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error contacting Groq AI during project planning: {str(e)}"
            )

    def generate_milestone_plan(
        self,
        project_title: str,
        milestone: str,
        preferred_stack: Optional[str] = None
    ) -> MilestonePlanResponse:
        """
        Generate a detailed implementation roadmap for a single project milestone.
        """
        if not self.api_key or not self.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq API is not configured or missing a valid API key on this server."
            )
        
        system_instruction = (
            "You are a senior software architect. Generate a detailed implementation roadmap for a single project milestone. "
            "You must return ONLY valid JSON with exactly the following structure:\n"
            "{\n"
            "  \"milestone\": \"...\",\n"
            "  \"overview\": \"...\",\n"
            "  \"subtasks\": [\n"
            "    {\n"
            "      \"title\": \"...\",\n"
            "      \"description\": \"...\",\n"
            "      \"priority\": \"High\",\n"
            "      \"estimated_hours\": 4\n"
            "    }\n"
            "  ],\n"
            "  \"api_endpoints\": [\"...\"],\n"
            "  \"database_tables\": [\"...\"],\n"
            "  \"folder_structure\": \"...\"\n"
            "}\n"
            "Do not allow markdown. Do not allow explanations. Do not wrap JSON inside ``` blocks."
        )

        user_content = (
            f"Project Title:\n{project_title}\n\n"
            f"Milestone to Plan:\n{milestone}\n\n"
        )
        if preferred_stack:
            user_content += f"Preferred Stack:\n{preferred_stack}\n\n"
            
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_content}
                ],
                response_format={"type": "json_object"},
                temperature=0
            )
            
            if not response or not response.choices or not response.choices[0].message.content:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Received empty content from Groq AI provider during milestone planning."
                )
                
            raw_reply = response.choices[0].message.content
            
            try:
                parsed_json = json.loads(raw_reply)
            except json.JSONDecodeError as decode_err:
                logger.error("Groq returned invalid JSON string: %s. Error: %s", raw_reply, str(decode_err))
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Groq API returned invalid JSON: {str(decode_err)}"
                )
            
            try:
                validated_response = MilestonePlanResponse.model_validate(parsed_json)
                return validated_response
            except Exception as val_err:
                logger.error("Pydantic validation failed for milestone plan: %s. Raw: %s", str(val_err), raw_reply)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to validate generated milestone plan JSON schema: {str(val_err)}"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Error calling Groq model for milestone plan generation.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error contacting Groq AI during milestone planning: {str(e)}"
            )

    def generate_database_design(
        self,
        project_title: str,
        description: str,
        preferred_database: Optional[str] = None
    ) -> DatabaseDesignResponse:
        """
        Generate a production-ready database design for a software project.
        """
        if not self.api_key or not self.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq API is not configured or missing a valid API key on this server."
            )
        
        system_instruction = (
            "You are a senior database architect. Generate a production-ready database design for the software project. "
            "You must return ONLY valid JSON with exactly the following structure:\n"
            "{\n"
            "  \"database\": \"PostgreSQL\",\n"
            "  \"tables\": [\n"
            "    {\n"
            "      \"name\": \"...\",\n"
            "      \"description\": \"...\",\n"
            "      \"columns\": [\n"
            "        {\n"
            "          \"name\": \"...\",\n"
            "          \"type\": \"...\",\n"
            "          \"primary_key\": true,\n"
            "          \"nullable\": false,\n"
            "          \"unique\": false\n"
            "        }\n"
            "      ]\n"
            "    }\n"
            "  ],\n"
            "  \"relationships\": [\n"
            "    {\n"
            "      \"from_table\": \"...\",\n"
            "      \"to_table\": \"...\",\n"
            "      \"relationship_type\": \"One-to-Many\"\n"
            "    }\n"
            "  ],\n"
            "  \"indexes\": [\"...\"]\n"
            "}\n"
            "Do not allow markdown. Do not allow explanations. Do not wrap JSON inside ``` blocks."
        )

        user_content = (
            f"Project Title:\n{project_title}\n\n"
            f"Project Description:\n{description}\n\n"
        )
        if preferred_database:
            user_content += f"Preferred Database:\n{preferred_database}\n\n"
            
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_content}
                ],
                response_format={"type": "json_object"},
                temperature=0
            )
            
            if not response or not response.choices or not response.choices[0].message.content:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Received empty content from Groq AI provider during database design."
                )
                
            raw_reply = response.choices[0].message.content
            
            try:
                parsed_json = json.loads(raw_reply)
            except json.JSONDecodeError as decode_err:
                logger.error("Groq returned invalid JSON string: %s. Error: %s", raw_reply, str(decode_err))
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Groq API returned invalid JSON: {str(decode_err)}"
                )
            
            try:
                validated_response = DatabaseDesignResponse.model_validate(parsed_json)
                return validated_response
            except Exception as val_err:
                logger.error("Pydantic validation failed for database design: %s. Raw: %s", str(val_err), raw_reply)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to validate generated database design JSON schema: {str(val_err)}"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Error calling Groq model for database design generation.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error contacting Groq AI during database design: {str(e)}"
            )

    def generate_api_design(
        self,
        project_title: str,
        description: str,
        database_tables: List[str]
    ) -> ApiDesignResponse:
        """
        Generate a production-ready REST API specification for a software project.
        """
        if not self.api_key or not self.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq API is not configured or missing a valid API key on this server."
            )
        
        system_instruction = (
            "You are a senior backend architect. Generate a production-ready REST API specification for the project. "
            "Generate REST resources, CRUD endpoints, authentication endpoints, request/response payload examples, and HTTP status codes. "
            "You must return ONLY valid JSON with exactly the following structure:\n"
            "{\n"
            "  \"base_url\": \"/api/v1\",\n"
            "  \"resources\": [\n"
            "    {\n"
            "      \"name\": \"...\",\n"
            "      \"endpoints\": [\n"
            "        {\n"
            "          \"method\": \"GET\",\n"
            "          \"path\": \"/...\",\n"
            "          \"description\": \"...\"\n"
            "        }\n"
            "      ]\n"
            "    }\n"
            "  ],\n"
            "  \"authentication\": {\n"
            "    \"login\": {\n"
            "      \"method\": \"POST\",\n"
            "      \"path\": \"/auth/login\",\n"
            "      \"description\": \"Authenticate user and return JWT\"\n"
            "    },\n"
            "    \"register\": {\n"
            "      \"method\": \"POST\",\n"
            "      \"path\": \"/auth/register\",\n"
            "      \"description\": \"Create a new user account\"\n"
            "    }\n"
            "  },\n"
            "  \"request_examples\": {},\n"
            "  \"response_examples\": {},\n"
            "  \"status_codes\": [200, 201, 400, 401, 403, 404, 500]\n"
            "}\n"
            "Do not allow markdown. Do not allow explanations. Do not wrap JSON inside ``` blocks."
        )

        user_content = (
            f"Project Title:\n{project_title}\n\n"
            f"Project Description:\n{description}\n\n"
            f"Database Tables:\n{', '.join(database_tables)}\n\n"
        )
            
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_content}
                ],
                response_format={"type": "json_object"},
                temperature=0
            )
            
            if not response or not response.choices or not response.choices[0].message.content:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Received empty content from Groq AI provider during API design."
                )
                
            raw_reply = response.choices[0].message.content
            
            try:
                parsed_json = json.loads(raw_reply)
            except json.JSONDecodeError as decode_err:
                logger.error("Groq returned invalid JSON string: %s. Error: %s", raw_reply, str(decode_err))
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Groq API returned invalid JSON: {str(decode_err)}"
                )
            
            try:
                validated_response = ApiDesignResponse.model_validate(parsed_json)
                return validated_response
            except Exception as val_err:
                logger.error("Pydantic validation failed for API design: %s. Raw: %s", str(val_err), raw_reply)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to validate generated API design JSON schema: {str(val_err)}"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Error calling Groq model for API design generation.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error contacting Groq AI during API design: {str(e)}"
            )

    def generate_architecture(
        self,
        project_title: str,
        description: str,
        tech_stack: TechStack,
        database_tables: List[str],
        api_resources: List[str]
    ) -> ArchitectureResponse:
        """
        Generate a production-ready software architecture plan from previous planners outputs.
        """
        if not self.api_key or not self.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq API is not configured or missing a valid API key on this server."
            )
        
        system_instruction = (
            "You are a senior software architect. Generate a production-ready software architecture plan. "
            "Generate Architecture Style, core modules, folder structures for both frontend and backend, external services, and component communication flows. "
            "You must return ONLY valid JSON with exactly the following structure:\n"
            "{\n"
            "  \"architecture_style\": \"...\",\n"
            "  \"modules\": [\"...\"],\n"
            "  \"folder_structure\": {\n"
            "    \"backend\": [\"...\"],\n"
            "    \"frontend\": [\"...\"]\n"
            "  },\n"
            "  \"external_services\": [\"...\"],\n"
            "  \"communication\": \"...\"\n"
            "}\n"
            "Do not allow markdown. Do not allow explanations. Do not wrap JSON inside ``` blocks."
        )

        user_content = (
            f"Project Title:\n{project_title}\n\n"
            f"Description:\n{description}\n\n"
            f"Tech Stack:\nFrontend: {tech_stack.frontend}, Backend: {tech_stack.backend}, Database: {tech_stack.database}\n\n"
            f"Database Tables:\n{', '.join(database_tables)}\n\n"
            f"API Resources:\n{', '.join(api_resources)}\n\n"
        )
            
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_content}
                ],
                response_format={"type": "json_object"},
                temperature=0
            )
            
            if not response or not response.choices or not response.choices[0].message.content:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Received empty content from Groq AI provider during architecture planning."
                )
                
            raw_reply = response.choices[0].message.content
            
            try:
                parsed_json = json.loads(raw_reply)
            except json.JSONDecodeError as decode_err:
                logger.error("Groq returned invalid JSON string: %s. Error: %s", raw_reply, str(decode_err))
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Groq API returned invalid JSON: {str(decode_err)}"
                )
            
            try:
                validated_response = ArchitectureResponse.model_validate(parsed_json)
                return validated_response
            except Exception as val_err:
                logger.error("Pydantic validation failed for architecture: %s. Raw: %s", str(val_err), raw_reply)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to validate generated architecture JSON schema: {str(val_err)}"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Error calling Groq model for architecture generation.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error contacting Groq AI during architecture planning: {str(e)}"
            )

    def generate_blueprint(
        self,
        idea: str,
        project_type: str,
        difficulty: str,
        timeline: str,
        preferred_stack: Optional[str] = None
    ) -> BlueprintResponse:
        """
        Create a complete software blueprint by sequentially calling the specialized AI planners.
        """
        # Step 1: Project Plan
        project_plan = self.generate_project_plan(
            idea=idea,
            project_type=project_type,
            difficulty=difficulty,
            timeline=timeline,
            preferred_stack=preferred_stack
        )
        
        # Step 2: Milestone Plan (first milestone)
        first_milestone = project_plan.milestones[0] if project_plan.milestones else "Initial Setup"
        milestone_plan = self.generate_milestone_plan(
            project_title=project_plan.title,
            milestone=first_milestone,
            preferred_stack=preferred_stack
        )
        
        # Step 3: Database Design
        preferred_db = project_plan.tech_stack.database if project_plan.tech_stack else preferred_stack
        database_design = self.generate_database_design(
            project_title=project_plan.title,
            description=project_plan.description,
            preferred_database=preferred_db
        )
        
        # Step 4: API Design
        database_tables = [table.name for table in database_design.tables]
        api_design = self.generate_api_design(
            project_title=project_plan.title,
            description=project_plan.description,
            database_tables=database_tables
        )
        
        # Step 5: Architecture Generator
        api_resources = [resource.name for resource in api_design.resources]
        architecture = self.generate_architecture(
            project_title=project_plan.title,
            description=project_plan.description,
            tech_stack=project_plan.tech_stack,
            database_tables=database_tables,
            api_resources=api_resources
        )
        
        return BlueprintResponse(
            project_plan=project_plan,
            milestone_plan=milestone_plan,
            database_design=database_design,
            api_design=api_design,
            architecture=architecture
        )

    def chat(self, message: str, project_context: Optional[BlueprintResponse] = None) -> ChatResponse:
        """
        Chat with a senior software architect AI.
        """
        if not self.api_key or not self.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq API is not configured or missing a valid API key on this server."
            )
        
        system_instruction = (
            "You are DevWorkspaceX AI, an expert Software Architect and Senior Full Stack Engineer. "
            "You are the built-in AI assistant inside DevWorkspaceX.\n\n"
            "Your purpose is to help developers:\n"
            "- Plan software\n"
            "- Design software architecture\n"
            "- Explain blueprints\n"
            "- Improve APIs\n"
            "- Improve databases\n"
            "- Review architecture\n"
            "- Suggest best practices\n"
            "- Generate implementation guidance\n"
            "- Answer software engineering questions\n"
            "- Help developers make technical decisions\n\n"
            "Never introduce yourself as ChatGPT or a generic AI assistant. Always behave as the official AI assistant of DevWorkspaceX.\n\n"
            "DevWorkspaceX is an AI-powered Software Architect platform. Its capabilities include: "
            "Project Planning, Architecture Generation, Database Design, API Design, Milestone Planning, "
            "Blueprint Dashboard, AI Chat Assistant, Future Code Generation, and Documentation Generation. "
            "If a user asks 'What is this application?' or 'What can this application do?', explain DevWorkspaceX naturally instead of answering generically.\n\n"
            "Responses should be like a senior engineer: professional, clear, structured, concise, and actionable. "
            "Whenever appropriate, include: Explanation, Best Practices, Recommended Approach, Potential Pitfalls, "
            "Implementation Steps, and Example Code. Avoid extremely long unnecessary responses."
        )

        messages = [
            {"role": "system", "content": system_instruction}
        ]

        if project_context:
            context_str = (
                f"Currently Planned Project Specifications:\n"
                f"- Title: {project_context.project_plan.title}\n"
                f"- Description: {project_context.project_plan.description}\n"
                f"- Tech Stack:\n"
                f"  * Frontend: {project_context.project_plan.tech_stack.frontend}\n"
                f"  * Backend: {project_context.project_plan.tech_stack.backend}\n"
                f"  * Database: {project_context.database_design.database or project_context.project_plan.tech_stack.database}\n"
                f"- Key Features: {', '.join(project_context.project_plan.features)}\n"
                f"- Database Tables: {', '.join([table.name for table in project_context.database_design.tables])}\n"
                f"- API Resources: {', '.join([res.name for res in project_context.api_design.resources])}\n"
                f"- Architecture Style: {project_context.architecture.architecture_style}\n"
                f"- Timeline Milestones: {', '.join(project_context.project_plan.milestones)}"
            )
            messages.append({
                "role": "system",
                "content": f"Here is the context of the project we are currently planning:\n{context_str}"
            })

        messages.append({"role": "user", "content": message})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages
            )
            
            if not response or not response.choices or not response.choices[0].message.content:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Received empty content from Groq AI provider during chat."
                )
                
            reply = response.choices[0].message.content
            return ChatResponse(reply=reply)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Error calling Groq model for chat.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error contacting Groq AI during chat: {str(e)}"
            )

    def generate_code(self, params: CodeGenerationRequest) -> CodeGenerationResponse:
        """
        Generate production-ready code for a specific module matching the project's specifications blueprint.
        """
        if not self.api_key or not self.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq API is not configured or missing a valid API key on this server."
            )

        # Handle project context extraction dynamically (allowing nested objects, dictionaries, or fallback fields)
        project_context = params.project_context or params.blueprint_context
        
        title = params.project_title or ""
        description = ""
        tech_stack_str = "Not specified"
        features_str = "Not specified"
        tables_str = "Not specified"
        api_resources_str = "Not specified"
        arch_style = "Not specified"
        milestones_str = "Not specified"

        if project_context:
            if isinstance(project_context, dict):
                title = title or project_context.get("title") or ""
                description = project_context.get("description") or ""
                
                # Check nested planner properties
                project_plan = project_context.get("project_plan") or {}
                if isinstance(project_plan, dict):
                    title = title or project_plan.get("title") or ""
                    description = description or project_plan.get("description") or ""
                    tech_stack = project_plan.get("tech_stack") or {}
                    if isinstance(tech_stack, dict):
                        tech_stack_str = f"Frontend: {tech_stack.get('frontend') or 'N/A'}, Backend: {tech_stack.get('backend') or 'N/A'}, Database: {tech_stack.get('database') or 'N/A'}"
                    features = project_plan.get("features") or []
                    if isinstance(features, list):
                        features_str = ", ".join(features)
                    milestones_list = project_plan.get("milestones") or []
                    if isinstance(milestones_list, list):
                        milestones_str = ", ".join([str(m) for m in milestones_list])

                db_design = project_context.get("database_design") or {}
                if isinstance(db_design, dict):
                    tables = db_design.get("tables") or []
                    if isinstance(tables, list):
                        tables_str = ", ".join([t.get("name", "") if isinstance(t, dict) else str(t) for t in tables])
                
                api_design = project_context.get("api_design") or {}
                if isinstance(api_design, dict):
                    resources = api_design.get("resources") or []
                    if isinstance(resources, list):
                        api_resources_str = ", ".join([r.get("name", "") if isinstance(r, dict) else str(r) for r in resources])
                
                arch = project_context.get("architecture") or {}
                if isinstance(arch, dict):
                    arch_style = arch.get("architecture_style") or "Not specified"
                    
                milestone_plan = project_context.get("milestone_plan") or {}
                if isinstance(milestone_plan, dict) and not milestones_str:
                    milestones_list = milestone_plan.get("milestones") or []
                    if isinstance(milestones_list, list):
                        milestones_str = ", ".join([str(m) for m in milestones_list])
            else:
                # It is a model object (e.g. BlueprintResponse)
                pp = getattr(project_context, "project_plan", None)
                if pp:
                    title = title or getattr(pp, "title", "")
                    description = getattr(pp, "description", "")
                    ts = getattr(pp, "tech_stack", None)
                    if ts:
                        tech_stack_str = f"Frontend: {getattr(ts, 'frontend', 'N/A')}, Backend: {getattr(ts, 'backend', 'N/A')}, Database: {getattr(ts, 'database', 'N/A')}"
                    features = getattr(pp, "features", [])
                    if isinstance(features, list):
                        features_str = ", ".join(features)
                    milestones_list = getattr(pp, "milestones", [])
                    if isinstance(milestones_list, list):
                        milestones_str = ", ".join([str(m) for m in milestones_list])
                        
                db = getattr(project_context, "database_design", None)
                if db:
                    tables = getattr(db, "tables", [])
                    tables_str = ", ".join([getattr(t, "name", "") for t in tables])
                    
                api_desc = getattr(project_context, "api_design", None)
                if api_desc:
                    resources = getattr(api_desc, "resources", [])
                    api_resources_str = ", ".join([getattr(r, "name", "") for r in resources])
                    
                arc = getattr(project_context, "architecture", None)
                if arc:
                    arch_style = getattr(arc, "architecture_style", "Not specified")
                    
                milestone_plan = getattr(project_context, "milestone_plan", None)
                if milestone_plan and not milestones_str:
                    milestones_list = getattr(milestone_plan, "milestones", [])
                    milestones_str = ", ".join([str(m) for m in milestones_list])

        context_str = (
            f"Project specifications:\n"
            f"- Title: {title}\n"
            f"- Description: {description}\n"
            f"- Tech Stack: {tech_stack_str}\n"
            f"- Key Features: {features_str}\n"
            f"- Database Tables: {tables_str}\n"
            f"- API Resources: {api_resources_str}\n"
            f"- Architecture Style: {arch_style}\n"
            f"- Timeline Milestones: {milestones_str}"
        )

        generate_doc_flag = params.generate_doc or params.include_docs

        prompt = (
            f"You are DevWorkspaceX AI, an expert Senior Full Stack Engineer. Generate production-ready software module files based on the project blueprint.\n\n"
            f"{context_str}\n\n"
            f"Task: Generate complete source code files for the selected module:\n"
            f"- Category: {params.category}\n"
            f"- Module: {params.module}\n"
            f"- Language: {params.language}\n"
            f"- Framework: {params.framework}\n"
            f"- Coding Style preference: {params.coding_style}\n"
            f"- Comment Level verbosity: {params.comment_level}\n"
            f"- Include Unit Tests: {params.include_tests}\n"
            f"- Generate Documentation notes: {generate_doc_flag}\n\n"
            f"Requirements:\n"
            f"1. Keep code complete. Do NOT use placeholders, comments like '// todo', or ellipsis. All function bodies must be fully implemented.\n"
            f"2. Some modules require multiple files (e.g. models, routes, services). Return them as separate files in the list.\n"
            f"3. Return ONLY a JSON object that satisfies the CodeGenerationResponse Pydantic schema structure.\n\n"
            f"JSON Response Schema Example:\n"
            f"{{\n"
            f"  \"files\": [\n"
            f"    {{\n"
            f"      \"filename\": \"auth_service.py\",\n"
            f"      \"language\": \"python\",\n"
            f"      \"content\": \"def authenticate():\\n    ...\"\n"
            f"    }}\n"
            f"  ]\n"
            f"}}"
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )

            if not response or not response.choices or not response.choices[0].message.content:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Received empty content from Groq AI provider during code generation."
                )

            data = json.loads(response.choices[0].message.content)
            from pydantic import ValidationError
            return CodeGenerationResponse.model_validate(data)

        except ValidationError as val_err:
            logger.error("JSON output validation failed against CodeGenerationResponse: %s", str(val_err))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI output validation error: {str(val_err)}"
            )
        except Exception as e:
            logger.exception("Error calling Groq model for code generation.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error contacting Groq AI during code generation: {str(e)}"
            )

    def generate_documentation(self, params: DocumentationRequest) -> DocumentationResponse:
        """
        Generate detailed professional markdown documentation files based on the project blueprint context.
        """
        if not self.api_key or not self.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq API is not configured or missing a valid API key on this server."
            )

        blueprint = params.project_context
        title = ""
        description = ""
        tech_stack_str = "Not specified"
        features_str = "Not specified"
        tables_str = "Not specified"
        api_resources_str = "Not specified"
        arch_style = "Not specified"
        milestones_str = "Not specified"

        if blueprint:
            if isinstance(blueprint, dict):
                title = blueprint.get("title") or ""
                description = blueprint.get("description") or ""
                
                project_plan = blueprint.get("project_plan") or {}
                if isinstance(project_plan, dict):
                    title = title or project_plan.get("title") or ""
                    description = description or project_plan.get("description") or ""
                    tech_stack = project_plan.get("tech_stack") or {}
                    if isinstance(tech_stack, dict):
                        tech_stack_str = f"Frontend: {tech_stack.get('frontend') or 'N/A'}, Backend: {tech_stack.get('backend') or 'N/A'}, Database: {tech_stack.get('database') or 'N/A'}"
                    features = project_plan.get("features") or []
                    if isinstance(features, list):
                        features_str = ", ".join(features)
                    milestones_list = project_plan.get("milestones") or []
                    if isinstance(milestones_list, list):
                        milestones_str = ", ".join([str(m) for m in milestones_list])

                db_design = blueprint.get("database_design") or {}
                if isinstance(db_design, dict):
                    tables = db_design.get("tables") or []
                    if isinstance(tables, list):
                        tables_str = ", ".join([t.get("name", "") if isinstance(t, dict) else str(t) for t in tables])
                
                api_design = blueprint.get("api_design") or {}
                if isinstance(api_design, dict):
                    resources = api_design.get("resources") or []
                    if isinstance(resources, list):
                        api_resources_str = ", ".join([r.get("name", "") if isinstance(r, dict) else str(r) for r in resources])
                
                arch = blueprint.get("architecture") or {}
                if isinstance(arch, dict):
                    arch_style = arch.get("architecture_style") or "Not specified"
            else:
                pp = getattr(blueprint, "project_plan", None)
                if pp:
                    title = getattr(pp, "title", "")
                    description = getattr(pp, "description", "")
                    ts = getattr(pp, "tech_stack", None)
                    if ts:
                        tech_stack_str = f"Frontend: {getattr(ts, 'frontend', 'N/A')}, Backend: {getattr(ts, 'backend', 'N/A')}, Database: {getattr(ts, 'database', 'N/A')}"
                    features = getattr(pp, "features", [])
                    if isinstance(features, list):
                        features_str = ", ".join(features)
                    milestones_list = getattr(pp, "milestones", [])
                    if isinstance(milestones_list, list):
                        milestones_str = ", ".join([str(m) for m in milestones_list])
                        
                db = getattr(blueprint, "database_design", None)
                if db:
                    tables = getattr(db, "tables", [])
                    tables_str = ", ".join([getattr(t, "name", "") for t in tables])
                    
                api_desc = getattr(blueprint, "api_design", None)
                if api_desc:
                    resources = getattr(api_desc, "resources", [])
                    api_resources_str = ", ".join([getattr(r, "name", "") for r in resources])
                    
                arc = getattr(blueprint, "architecture", None)
                if arc:
                    arch_style = getattr(arc, "architecture_style", "Not specified")

        filenames_map = {
            "readme": "README.md",
            "installation": "INSTALL.md",
            "overview": "OVERVIEW.md",
            "folder_structure": "STRUCTURE.md",
            "architecture": "ARCHITECTURE.md",
            "database": "DATABASE.md",
            "api": "API.md",
            "deployment": "DEPLOYMENT.md",
            "env_vars": "ENV_VARS.md",
            "developer": "DEVELOPER.md"
        }
        filename = filenames_map.get(params.doc_type, f"{params.doc_type.upper()}.md")

        prompt = (
            f"You are DevWorkspaceX AI, an expert Senior Software Architect. "
            f"Generate a professional, detailed, complete markdown document: '{filename}' based on the project blueprint.\n\n"
            f"Project Blueprint Specifications:\n"
            f"- Title: {title}\n"
            f"- Description: {description}\n"
            f"- Technology Stack: {tech_stack_str}\n"
            f"- Features List: {features_str}\n"
            f"- Database schemas: {tables_str}\n"
            f"- API resources: {api_resources_str}\n"
            f"- Architecture Style: {arch_style}\n"
            f"- Timelines/Milestones: {milestones_str}\n\n"
            f"Requested Document Type: {params.doc_type}\n"
            f"Your task is to write the complete content of this document in clean Markdown. "
            f"Do NOT output generic templates or placeholders like 'TODO: fill this in'. All sections must be fully written out. "
            f"Provide code examples, tables, or structural details if relevant to the document type.\n"
            f"Do NOT wrap your entire response in markdown code blocks. Just output the raw document content."
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            if not response or not response.choices or not response.choices[0].message.content:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Received empty content from Groq AI provider during documentation generation."
                )

            content = response.choices[0].message.content
            return DocumentationResponse(
                doc_type=params.doc_type,
                filename=filename,
                content=content
            )

        except Exception as e:
            logger.exception("Error calling Groq model for documentation generation.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error contacting Groq AI during documentation generation: {str(e)}"
            )

    def generate_review(self, params: ReviewRequest) -> ReviewResponse:
        """
        Generate detailed professional design reviews (strengths, weaknesses, and priority recommendation lists)
        and scores for the project blueprint.
        """
        if not self.api_key or not self.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq API is not configured or missing a valid API key on this server."
            )

        blueprint = params.project_context
        title = ""
        description = ""
        tech_stack_str = "Not specified"
        features_str = "Not specified"
        tables_str = "Not specified"
        api_resources_str = "Not specified"
        arch_style = "Not specified"
        milestones_str = "Not specified"

        if blueprint:
            if isinstance(blueprint, dict):
                title = blueprint.get("title") or ""
                description = blueprint.get("description") or ""
                
                project_plan = blueprint.get("project_plan") or {}
                if isinstance(project_plan, dict):
                    title = title or project_plan.get("title") or ""
                    description = description or project_plan.get("description") or ""
                    tech_stack = project_plan.get("tech_stack") or {}
                    if isinstance(tech_stack, dict):
                        tech_stack_str = f"Frontend: {tech_stack.get('frontend') or 'N/A'}, Backend: {tech_stack.get('backend') or 'N/A'}, Database: {tech_stack.get('database') or 'N/A'}"
                    features = project_plan.get("features") or []
                    if isinstance(features, list):
                        features_str = ", ".join(features)
                    milestones_list = project_plan.get("milestones") or []
                    if isinstance(milestones_list, list):
                        milestones_str = ", ".join([str(m) for m in milestones_list])

                db_design = blueprint.get("database_design") or {}
                if isinstance(db_design, dict):
                    tables = db_design.get("tables") or []
                    if isinstance(tables, list):
                        tables_str = ", ".join([t.get("name", "") if isinstance(t, dict) else str(t) for t in tables])
                
                api_design = blueprint.get("api_design") or {}
                if isinstance(api_design, dict):
                    resources = api_design.get("resources") or []
                    if isinstance(resources, list):
                        api_resources_str = ", ".join([r.get("name", "") if isinstance(r, dict) else str(r) for r in resources])
                
                arch = blueprint.get("architecture") or {}
                if isinstance(arch, dict):
                    arch_style = arch.get("architecture_style") or "Not specified"
            else:
                pp = getattr(blueprint, "project_plan", None)
                if pp:
                    title = getattr(pp, "title", "")
                    description = getattr(pp, "description", "")
                    ts = getattr(pp, "tech_stack", None)
                    if ts:
                        tech_stack_str = f"Frontend: {getattr(ts, 'frontend', 'N/A')}, Backend: {getattr(ts, 'backend', 'N/A')}, Database: {getattr(ts, 'database', 'N/A')}"
                    features = getattr(pp, "features", [])
                    if isinstance(features, list):
                        features_str = ", ".join(features)
                    milestones_list = getattr(pp, "milestones", [])
                    if isinstance(milestones_list, list):
                        milestones_str = ", ".join([str(m) for m in milestones_list])
                        
                db = getattr(blueprint, "database_design", None)
                if db:
                    tables = getattr(db, "tables", [])
                    tables_str = ", ".join([getattr(t, "name", "") for t in tables])
                    
                api_desc = getattr(blueprint, "api_design", None)
                if api_desc:
                    resources = getattr(api_desc, "resources", [])
                    api_resources_str = ", ".join([getattr(r, "name", "") for r in resources])
                    
                arc = getattr(blueprint, "architecture", None)
                if arc:
                    arch_style = getattr(arc, "architecture_style", "Not specified")

        prompt = (
            f"You are DevWorkspaceX AI, an expert Senior Software Architect. "
            f"Analyze the following project specifications blueprint and generate a detailed Review Report containing category scores, strengths, weaknesses, and priority recommendations:\n\n"
            f"Project Specs:\n"
            f"- Title: {title}\n"
            f"- Description: {description}\n"
            f"- Stack: {tech_stack_str}\n"
            f"- Features: {features_str}\n"
            f"- Database: {tables_str}\n"
            f"- API: {api_resources_str}\n"
            f"- Architecture: {arch_style}\n"
            f"- Milestones: {milestones_str}\n\n"
            f"Categories to evaluate:\n"
            f"- Architecture Review\n"
            f"- Database Review\n"
            f"- API Review\n"
            f"- Security Review\n"
            f"- Performance Review\n"
            f"- Scalability Review\n"
            f"- Folder Structure Review\n\n"
            f"Requirements:\n"
            f"1. Score each category out of 100 and calculate an Overall score. Return them as a key-value dictionary.\n"
            f"2. List specific strengths, weaknesses, and concrete actionable recommendations (with priority: HIGH, MEDIUM, LOW and optional fix_snippet if relevant) for each category.\n"
            f"3. Return ONLY a JSON object that satisfies the ReviewResponse Pydantic schema structure.\n\n"
            f"JSON Response Schema Example:\n"
            f"{{\n"
            f"  \"scores\": {{\n"
            f"    \"architecture\": 85,\n"
            f"    \"database\": 78,\n"
            f"    \"api\": 90,\n"
            f"    \"security\": 70,\n"
            f"    \"overall\": 81\n"
            f"  }},\n"
            f"  \"categories\": [\n"
            f"    {{\n"
            f"      \"category\": \"Architecture Review\",\n"
            f"      \"strengths\": [\"Clean isolation Layer\"],\n"
            f"      \"weaknesses\": [\"Missing retry handler middleware\"],\n"
            f"      \"recommendations\": [\n"
            f"        {{\n"
            f"          \"title\": \"Implement error retry handlers\",\n"
            f"          \"priority\": \"HIGH\",\n"
            f"          \"description\": \"Integrate basic HTTP retries in the request client.\",\n"
            f"          \"fix_snippet\": \"def fetch_with_retry():\\n    ...\"\n"
            f"        }}\n"
            f"      ]\n"
            f"    }}\n"
            f"  ],\n"
            f"  \"overall_summary\": \"Overall the blueprint represents a solid developer foundation...\"\n"
            f"}}"
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )

            if not response or not response.choices or not response.choices[0].message.content:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Received empty content from Groq AI provider during review generation."
                )

            data = json.loads(response.choices[0].message.content)
            from pydantic import ValidationError
            return ReviewResponse.model_validate(data)

        except ValidationError as val_err:
            logger.error("JSON output validation failed against ReviewResponse: %s", str(val_err))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI output validation error: {str(val_err)}"
            )
        except Exception as e:
            logger.exception("Error calling Groq model for review generation.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error contacting Groq AI during review generation: {str(e)}"
            )

# Compatibility aliases for existing project router
GeminiService = AIService
