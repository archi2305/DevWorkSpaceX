"""add mentions reactions attachments to comments

Revision ID: add_mentions_reactions_attachments
Revises: c34b8f6210a2
Create Date: 2026-07-14 20:15:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic.
revision = 'add_mentions_reactions_attachments'
down_revision = 'c34b8f6210a2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to comments table
    op.add_column('comments', sa.Column('content_markdown', sa.Text(), nullable=True))
    op.add_column('comments', sa.Column('mentions', JSON(), nullable=True))
    op.add_column('comments', sa.Column('reactions', JSON(), nullable=True))
    op.add_column('comments', sa.Column('attachments', JSON(), nullable=True))
    op.add_column('comments', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')))
    
    # Add new columns to comment_replies table
    op.add_column('comment_replies', sa.Column('content_markdown', sa.Text(), nullable=True))
    op.add_column('comment_replies', sa.Column('mentions', JSON(), nullable=True))
    op.add_column('comment_replies', sa.Column('reactions', JSON(), nullable=True))
    op.add_column('comment_replies', sa.Column('attachments', JSON(), nullable=True))
    op.add_column('comment_replies', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')))


def downgrade() -> None:
    # Remove columns from comments table
    op.drop_column('comments', 'updated_at')
    op.drop_column('comments', 'attachments')
    op.drop_column('comments', 'reactions')
    op.drop_column('comments', 'mentions')
    op.drop_column('comments', 'content_markdown')
    
    # Remove columns from comment_replies table
    op.drop_column('comment_replies', 'updated_at')
    op.drop_column('comment_replies', 'attachments')
    op.drop_column('comment_replies', 'reactions')
    op.drop_column('comment_replies', 'mentions')
    op.drop_column('comment_replies', 'content_markdown')
