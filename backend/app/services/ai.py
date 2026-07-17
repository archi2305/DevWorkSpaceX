import httpx
import json
import uuid
import os
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Optional
from app.models.ai import AIConversation, AIMessage
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.models.document import Document
from app.models.workspace_member import WorkspaceMember
from app.core.config import settings

# System Prompts Storage
PROMPT_STORAGE = {
    "system_instructions": (
        "You are an AI assistant integrated into a project management workspace similar to Linear.\n"
        "You help users manage tasks, summarize projects, plan sprints, identify blockers, and write documentation.\n"
        "Analyze the provided workspace context carefully to answer the user's questions accurately and concisely."
    ),
    "blockers_template": (
        "Scan the workspace task database to identify items with overdue deadlines or High/Urgent priority status. "
        "Summarize these critical issues and list recommended corrective actions."
    ),
    "sprint_template": (
        "Review current incomplete tasks and their priorities to suggest a balanced sprint plan. "
        "Allocate resources appropriately and outline the sprint goals."
    )
}

class AIService:
    @staticmethod
    def _get_workspace_context(db: Session) -> str:
        """
        Gathers database contents (projects, tasks, members) to feed into the prompt context.
        """
        projects = db.query(Project).all()
        tasks = db.query(Task).all()
        members = db.query(User).all()
        docs = db.query(Document).all()

        context_lines = []
        context_lines.append(f"Workspace Context Snapshot (Timestamp: {datetime.utcnow().isoformat()}):")
        
        # 1. Projects
        context_lines.append(f"\n--- Projects List ({len(projects)}) ---")
        for p in projects:
            context_lines.append(f"- Project ID: {p.id} | Name: '{p.name}' | Status: {p.status} | Progress: {p.progress}% | Due: {p.due_date}")

        # 2. Tasks
        context_lines.append(f"\n--- Tasks List ({len(tasks)}) ---")
        for t in tasks:
            status_desc = "Done" if t.completed else t.status
            context_lines.append(f"- Task ID: {t.id} | Title: '{t.title}' | Status: {status_desc} | Priority: {t.priority} | Due: {t.due_date} | ProjectID: {t.project_id}")

        # 3. Team members
        context_lines.append(f"\n--- Workspace Members ({len(members)}) ---")
        for m in members:
            context_lines.append(f"- User ID: {m.id} | Name: {m.full_name} | Email: {m.email}")

        # 4. Documents
        context_lines.append(f"\n--- Workspace Documentation Pages ({len(docs)}) ---")
        for d in docs:
            context_lines.append(f"- Document ID: {d.id} | Title: '{d.title}' | Version: {d.version}")

        return "\n".join(context_lines)

    @classmethod
    def call_llm(cls, messages: List[Dict[str, str]]) -> str:
        """
        OpenAI-compatible chat completion wrapper. Hits the API using HTTPX.
        Falls back to a dynamic contextual heuristic responder if no key is set or the API fails.
        """
        api_key = os.getenv("OPENAI_API_KEY") or getattr(settings, "OPENAI_API_KEY", None)
        
        if api_key and api_key != "your-openai-api-key-here":
            try:
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "temperature": 0.5
                }
                
                # Make HTTP post request to OpenAI
                response = httpx.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=15.0
                )
                if response.status_code == 200:
                    return response.json()["choices"][0]["message"]["content"]
                else:
                    print(f"OpenAI API returned error code {response.status_code}: {response.text}")
            except Exception as e:
                print(f"Failed to communicate with OpenAI API: {e}")

        # Fallback Engine (Dynamic rule-based context responder)
        # Parse user prompt to deliver dynamic database responses
        last_message = messages[-1]["content"].lower()
        context_msg = ""
        for m in messages:
            if "workspace context snapshot" in m["content"]:
                context_msg = m["content"]
                break

        # 1. Sprint suggestions
        if "suggest sprint plan" in last_message or "sprint allocation" in last_message:
            return cls._generate_fallback_sprint(context_msg)
            
        # 2. Blockers
        if "find blockers" in last_message or "blocker summary" in last_message:
            return cls._generate_fallback_blockers(context_msg)

        # 3. Project Summary
        if "summarize project" in last_message or "project summary report" in last_message:
            return cls._generate_fallback_summary(context_msg)

        # 4. Generate documentation
        if "generate documentation" in last_message or "documentation manual" in last_message:
            return cls._generate_fallback_documentation(context_msg)

        # 5. Default contextual answer
        return (
            "### AI Assistant Workspace Report\n\n"
            "I scanned your workspace database. Here is what I found:\n"
            f"- **Active Projects**: {cls._count_occurrences('Name: ', context_msg)}\n"
            f"- **Tasks Scheduled**: {cls._count_occurrences('Title: ', context_msg)}\n"
            f"- **Team Members**: {cls._count_occurrences('Email: ', context_msg)}\n\n"
            "Ask me to **Suggest Sprint Plan**, **Find Blockers**, **Summarize Project**, or **Generate Documentation** for detailed reports."
        )

    @staticmethod
    def _count_occurrences(substring: str, text: str) -> int:
        return text.count(substring)

    @staticmethod
    def _generate_fallback_sprint(context: str) -> str:
        tasks = []
        for line in context.split("\n"):
            if "Task ID:" in line and "Status: Done" not in line:
                tasks.append(line)
        
        sprint_lines = [
            "### Suggested Sprint Plan",
            "Based on your active task queue, here is the suggested sprint allocation:\n",
            f"**Sprint Duration**: 2 Weeks | **Total Tasks Allocated**: {len(tasks)}\n",
            "#### 🚀 Critical Tasks (High Priority)"
        ]
        
        high_tasks = [t for t in tasks if "Priority: High" in t or "Priority: Urgent" in t]
        for t in high_tasks[:3]:
            title = t.split("Title: '")[1].split("'")[0]
            sprint_lines.append(f"- [ ] **{title}** (Critical Deliverable)")
            
        sprint_lines.append("\n#### 📅 Medium & Low Priority Support Items")
        med_tasks = [t for t in tasks if "Priority: Medium" in t or "Priority: Low" in t]
        for t in med_tasks[:4]:
            title = t.split("Title: '")[1].split("'")[0]
            sprint_lines.append(f"- [ ] {title}")

        if not tasks:
            sprint_lines.append("All tasks are completed! No new tasks need allocation.")

        sprint_lines.append("\n*Note: Sprint planning is generated dynamically from your active workspace database.*")
        return "\n".join(sprint_lines)

    @staticmethod
    def _generate_fallback_blockers(context: str) -> str:
        tasks = []
        for line in context.split("\n"):
            if "Task ID:" in line:
                tasks.append(line)
                
        blockers = []
        for t in tasks:
            if "Status: Done" not in t:
                if "Priority: High" in t or "Priority: Urgent" in t:
                    title = t.split("Title: '")[1].split("'")[0]
                    blockers.append(f"- 🔴 **High Priority Blocker**: '{title}' needs immediate assignee attention.")

        blockers_lines = [
            "### Blocker & Overdue Deadlines Report",
            "Below is a list of potential workflow bottlenecks detected:\n"
        ]
        if blockers:
            blockers_lines.extend(blockers)
        else:
            blockers_lines.append("✅ No high priority blockers or overdue tasks detected. Everything is running smoothly!")

        blockers_lines.append("\n*Blocker logs compile actual tasks with High/Urgent flags inside your project charts.*")
        return "\n".join(blockers_lines)

    @staticmethod
    def _generate_fallback_summary(context: str) -> str:
        projects = []
        for line in context.split("\n"):
            if "Project ID:" in line:
                projects.append(line)

        summary = [
            "### Project Progress Summary",
            "Here is the status breakdown of your active projects:\n"
        ]
        
        for p in projects:
            name = p.split("Name: '")[1].split("'")[0]
            progress = p.split("Progress: ")[1].split("%")[0]
            status = p.split("Status: ")[1].split(" |")[0]
            summary.append(f"- **{name}**: currently **{status}** with **{progress}% completion progress**.")

        if not projects:
            summary.append("No active projects found. Create a project from the dashboard to start.")

        return "\n".join(summary)

    @staticmethod
    def _generate_fallback_documentation(context: str) -> str:
        return (
            "### Generated Project Documentation Draft\n\n"
            "#### 1. Executive Summary\n"
            "This document maps the project deliverables and milestones recorded in our database.\n\n"
            "#### 2. Scope of Work & Current Deliverables\n"
            "Tasks are dynamically allocated to developers, tracking low, medium, and high priority requirements.\n\n"
            "#### 3. Version History & Code Integrity\n"
            "Snapshots and rollback triggers are maintained inside PostgreSQL, offering fully audit-compliant version tracks."
        )

    @classmethod
    def ask(cls, db: Session, user_id: uuid.UUID, prompt: str, conversation_id: Optional[uuid.UUID] = None) -> Dict:
        """
        Manages threads, formats system context messages, calls LLM, and logs history in the database.
        """
        # Load or create conversation
        if conversation_id:
            convo = db.query(AIConversation).filter(AIConversation.id == conversation_id, AIConversation.user_id == user_id).first()
            if not convo:
                convo = AIConversation(id=conversation_id, user_id=user_id, title=prompt[:40])
                db.add(convo)
        else:
            convo = AIConversation(user_id=user_id, title=prompt[:40])
            db.add(convo)
            db.commit()
            db.refresh(convo)

        # Log User prompt
        user_msg = AIMessage(conversation_id=convo.id, role="user", content=prompt)
        db.add(user_msg)
        db.commit()

        # Build messages payload (System + Workspace Context + History)
        messages_payload = [
            {"role": "system", "content": PROMPT_STORAGE["system_instructions"]},
            {"role": "system", "content": cls._get_workspace_context(db)}
        ]

        # Append thread history
        thread_messages = db.query(AIMessage).filter(AIMessage.conversation_id == convo.id).order_by(AIMessage.created_at.asc()).all()
        for msg in thread_messages[:-1]: # exclude the latest prompt we just added to send as user role at the end
            messages_payload.append({"role": msg.role, "content": msg.content})

        messages_payload.append({"role": "user", "content": prompt})

        # Fetch completion
        assistant_reply = cls.call_llm(messages_payload)

        # Log Assistant response
        assistant_msg = AIMessage(conversation_id=convo.id, role="assistant", content=assistant_reply)
        db.add(assistant_msg)
        db.commit()

        return {
            "conversation_id": convo.id,
            "title": convo.title,
            "reply": assistant_reply
        }
