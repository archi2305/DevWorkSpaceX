"""index milestone management

Revision ID: a71d2f4b8c90
Revises: 9f2c8d1b4a6e
Create Date: 2026-07-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "a71d2f4b8c90"
down_revision: Union[str, Sequence[str], None] = "9f2c8d1b4a6e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = "1e1addc55ba5"


def upgrade() -> None:
    op.create_index("ix_milestones_project_due_date", "milestones", ["project_id", "due_date"])
    op.create_index("ix_milestones_project_status", "milestones", ["project_id", "status"])
    op.create_index("ix_tasks_milestone_id", "tasks", ["milestone_id"])


def downgrade() -> None:
    op.drop_index("ix_tasks_milestone_id", table_name="tasks")
    op.drop_index("ix_milestones_project_status", table_name="milestones")
    op.drop_index("ix_milestones_project_due_date", table_name="milestones")
