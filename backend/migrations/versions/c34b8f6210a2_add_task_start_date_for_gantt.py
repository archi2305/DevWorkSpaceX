"""add task start date for gantt

Revision ID: c34b8f6210a2
Revises: a71d2f4b8c90
Create Date: 2026-07-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c34b8f6210a2"
down_revision: Union[str, Sequence[str], None] = "a71d2f4b8c90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("start_date", sa.String(length=50), nullable=True))
    op.create_index("ix_tasks_project_start_due", "tasks", ["project_id", "start_date", "due_date"])


def downgrade() -> None:
    op.drop_index("ix_tasks_project_start_due", table_name="tasks")
    op.drop_column("tasks", "start_date")
