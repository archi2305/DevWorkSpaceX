import io
import csv
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.sprint import Sprint
from app.models.workspace_member import WorkspaceMember

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])

@router.get(
    "/export",
    summary="Export project, sprint, task, or team reports"
)
def export_report(
    type: str = Query(..., description="Report type: project, sprint, task, or team"),
    format: str = Query(..., description="Export format: pdf, excel, csv"),
    project_id: Optional[uuid.UUID] = None,
    sprint_id: Optional[uuid.UUID] = None,
    user_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch appropriate report dataset
    headers = []
    rows = []
    title = ""

    if type == "project":
        title = "Project Status Deliverables Report"
        headers = ["Project Name", "Status", "Priority", "Progress", "Due Date"]
        query = db.query(Project)
        if project_id:
            query = query.filter(Project.id == project_id)
        projects = query.all()
        for p in projects:
            rows.append([
                p.name,
                p.status,
                p.priority,
                f"{p.progress}%",
                p.due_date.strftime("%Y-%m-%d") if p.due_date else "N/A"
            ])

    elif type == "sprint":
        title = "Sprint Status Progress Report"
        headers = ["Sprint Name", "Status", "Duration Weeks", "Start Date", "End Date"]
        query = db.query(Sprint)
        if project_id:
            query = query.filter(Sprint.project_id == project_id)
        if sprint_id:
            query = query.filter(Sprint.id == sprint_id)
        sprints = query.all()
        for s in sprints:
            rows.append([
                s.name,
                s.status,
                str(s.duration_weeks),
                s.start_date.strftime("%Y-%m-%d") if s.start_date else "N/A",
                s.end_date.strftime("%Y-%m-%d") if s.end_date else "N/A"
            ])

    elif type == "task":
        title = "Tasks Deadlines & Status Report"
        headers = ["Task Title", "Status", "Priority", "Due Date", "Assignee"]
        query = db.query(Task)
        if project_id:
            query = query.filter(Task.project_id == project_id)
        if sprint_id:
            query = query.filter(Task.sprint_id == sprint_id)
        if user_id:
            query = query.filter(Task.assignee_id == user_id)
        tasks = query.all()
        for t in tasks:
            assignee_name = t.assignee.full_name if t.assignee else "Unassigned"
            rows.append([
                t.title,
                "Done" if t.completed else t.status,
                t.priority,
                t.due_date if t.due_date else "N/A",
                assignee_name
            ])

    elif type == "team":
        title = "Team Workspace Allocations Report"
        headers = ["Team Member", "Email", "Active Tasks Count", "Completed Tasks Count"]
        query = db.query(User)
        members = query.all()
        for m in members:
            active_count = db.query(Task).filter(Task.assignee_id == m.id, Task.completed == False).count()
            completed_count = db.query(Task).filter(Task.assignee_id == m.id, Task.completed == True).count()
            rows.append([
                m.full_name,
                m.email,
                str(active_count),
                str(completed_count)
            ])
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid report type. Choose: project, sprint, task, or team."
        )

    # Export compilation handlers
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([title])
        writer.writerow([])
        writer.writerow(headers)
        writer.writerows(rows)
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={type}_report.csv"}
        )

    elif format == "excel":
        # Dynamic Excel generation (Excel natively opens TSV as spreadsheet)
        output = io.StringIO()
        writer = csv.writer(output, delimiter="\t")
        writer.writerow([title])
        writer.writerow([])
        writer.writerow(headers)
        writer.writerows(rows)
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="application/vnd.ms-excel",
            headers={"Content-Disposition": f"attachment; filename={type}_report.xls"}
        )

    elif format == "pdf":
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        styles = getSampleStyleSheet()
        
        # Styles definitions
        title_style = ParagraphStyle(
            name="ReportTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#111315"),
            spaceAfter=20
        )
        meta_style = ParagraphStyle(
            name="ReportMeta",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#7E848C"),
            spaceAfter=30
        )

        elements = []
        # Title paragraph
        elements.append(Paragraph(title, title_style))
        elements.append(Paragraph(f"Generated at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} by {current_user.full_name}", meta_style))
        
        # Grid table
        table_data = [headers] + rows
        t = Table(table_data, hAlign="LEFT")
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#171A1D")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#FFFFFF")),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("TOPPADDING", (0, 0), (-1, 0), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E1E4E6")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F9FA")]),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
            ("TOPPADDING", (0, 1), (-1, -1), 6),
        ]))
        elements.append(t)
        
        doc.build(elements)
        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={type}_report.pdf"}
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid export format. Choose: pdf, excel, or csv."
        )
