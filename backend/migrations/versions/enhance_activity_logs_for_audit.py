"""enhance activity logs for audit

Revision ID: c9f8e7d6a5b4
Revises: bd3c3f5d32d4
Create Date: 2026-07-14 11:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c9f8e7d6a5b4'
down_revision: Union[str, Sequence[str], None] = 'bd3c3f5d32d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Add new columns to activities table
    op.add_column('activities', sa.Column('category', sa.String(length=50), nullable=True))
    op.add_column('activities', sa.Column('event_type', sa.String(length=50), nullable=True))
    op.add_column('activities', sa.Column('target_id', sa.UUID(), nullable=True))
    op.add_column('activities', sa.Column('ip_address', sa.String(length=45), nullable=True))
    op.add_column('activities', sa.Column('user_agent', sa.String(length=500), nullable=True))
    op.add_column('activities', sa.Column('metadata', postgresql.JSON(), nullable=True))
    
    # Create indexes for filtering
    op.create_index('ix_activities_category', 'activities', ['category'])
    op.create_index('ix_activities_event_type', 'activities', ['event_type'])
    op.create_index('ix_activities_created_at', 'activities', ['created_at'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_activities_created_at', table_name='activities')
    op.drop_index('ix_activities_event_type', table_name='activities')
    op.drop_index('ix_activities_category', table_name='activities')
    
    # Remove new columns
    op.drop_column('activities', 'metadata')
    op.drop_column('activities', 'user_agent')
    op.drop_column('activities', 'ip_address')
    op.drop_column('activities', 'target_id')
    op.drop_column('activities', 'event_type')
    op.drop_column('activities', 'category')
