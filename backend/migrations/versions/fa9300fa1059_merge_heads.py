"""merge heads

Revision ID: fa9300fa1059
Revises: add_mentions_reactions_attachments, c9f8e7d6a5b4
Create Date: 2026-07-15 14:01:35.589324

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa9300fa1059'
down_revision: Union[str, Sequence[str], None] = ('add_mentions_reactions_attachments', 'c9f8e7d6a5b4')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
