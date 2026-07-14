"""enhance sprint management

Revision ID: 9f2c8d1b4a6e
Revises: 19417d107612
Create Date: 2026-07-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9f2c8d1b4a6e"
down_revision: Union[str, Sequence[str], None] = "19417d107612"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = "f7402715ae96"


def upgrade() -> None:
    op.add_column("sprints", sa.Column("description", sa.String(length=2000), nullable=True))
    op.add_column("sprints", sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("sprints", sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_sprints_project_status", "sprints", ["project_id", "status"])
    op.create_index("ix_tasks_sprint_id", "tasks", ["sprint_id"])
    op.alter_column("sprints", "is_archived", server_default=None)


def downgrade() -> None:
    op.drop_index("ix_tasks_sprint_id", table_name="tasks")
    op.drop_index("ix_sprints_project_status", table_name="sprints")
    op.drop_column("sprints", "archived_at")
    op.drop_column("sprints", "is_archived")
    op.drop_column("sprints", "description")
