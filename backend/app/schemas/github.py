import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class GithubRepositoryResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    full_name: str
    html_url: str

    class Config:
        from_attributes = True

class GithubRepositoryCreate(BaseModel):
    name: str
    full_name: str
    html_url: str

class GithubPullRequestResponse(BaseModel):
    id: uuid.UUID
    repository_id: uuid.UUID
    number: int
    title: str
    state: str
    html_url: str
    task_id: Optional[uuid.UUID] = None

    class Config:
        from_attributes = True

class GithubPullRequestCreate(BaseModel):
    repository_id: uuid.UUID
    number: int
    title: str
    state: str
    html_url: str
    task_id: Optional[uuid.UUID] = None

class GithubCommitResponse(BaseModel):
    id: uuid.UUID
    repository_id: uuid.UUID
    sha: str
    message: str
    author: str
    html_url: str

    class Config:
        from_attributes = True

class GithubIssueResponse(BaseModel):
    id: uuid.UUID
    repository_id: uuid.UUID
    number: int
    title: str
    state: str
    html_url: str

    class Config:
        from_attributes = True

class GithubBranchResponse(BaseModel):
    id: uuid.UUID
    repository_id: uuid.UUID
    name: str
    protected: bool

    class Config:
        from_attributes = True

class GithubDeploymentResponse(BaseModel):
    id: uuid.UUID
    repository_id: uuid.UUID
    environment: str
    status: str
    updated_at: datetime

    class Config:
        from_attributes = True

class OAuthCallbackRequest(BaseModel):
    code: str

class LinkTaskRequest(BaseModel):
    task_id: uuid.UUID

class GithubWorkflowRunResponse(BaseModel):
    id: uuid.UUID
    repository_id: uuid.UUID
    run_number: int
    event: str
    status: str
    conclusion: Optional[str] = None
    html_url: str
    created_at: datetime

    class Config:
        from_attributes = True

class GithubWorkflowRunCreate(BaseModel):
    repository_id: uuid.UUID
    run_number: int
    event: str
    status: str
    conclusion: Optional[str] = None
    html_url: str

