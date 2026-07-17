from pydantic import BaseModel, Field

class GeminiTestRequest(BaseModel):
    message: str = Field(..., description="Message payload to send to Google Gemini LLM")

class GeminiTestResponse(BaseModel):
    reply: str = Field(..., description="Text response reply from the LLM model")
