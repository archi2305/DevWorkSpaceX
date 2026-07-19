import logging
import json
from groq import Groq
from fastapi import HTTPException, status
from app.core.config import settings
from app.ai.schemas import ProjectPlanResponse, MilestonePlanResponse, DatabaseDesignResponse, ApiDesignResponse, ArchitectureResponse, TechStack, BlueprintResponse, ChatResponse

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

    def chat(self, message: str) -> ChatResponse:
        """
        Chat with a senior software architect AI.
        """
        if not self.api_key or not self.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Groq API is not configured or missing a valid API key on this server."
            )
        
        system_instruction = (
            "You are a senior software architect. Provide clear, concise, and expert guidance on software design, "
            "architecture, systems planning, databases, and backend services."
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": message}
                ]
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

# Compatibility aliases for existing project router
GeminiService = AIService
