"""Add uploaded_files table

Revision ID: 004
Revises: 003
Create Date: 2025-12-23 10:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create uploaded_files table
    op.create_table('uploaded_files',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('original_filename', sa.String(255), nullable=False),
        sa.Column('storage_key', sa.String(512), nullable=False),
        sa.Column('storage_url', sa.Text(), nullable=False),
        sa.Column('content_type', sa.String(100), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('contract_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('file_purpose', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['contract_id'], ['contracts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('storage_key')
    )

    # Create indexes for efficient querying
    op.create_index('ix_uploaded_files_user_id', 'uploaded_files', ['user_id'])
    op.create_index('ix_uploaded_files_contract_id', 'uploaded_files', ['contract_id'])
    op.create_index('ix_uploaded_files_file_purpose', 'uploaded_files', ['file_purpose'])
    op.create_index('ix_uploaded_files_created_at', 'uploaded_files', ['created_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_uploaded_files_created_at', table_name='uploaded_files')
    op.drop_index('ix_uploaded_files_file_purpose', table_name='uploaded_files')
    op.drop_index('ix_uploaded_files_contract_id', table_name='uploaded_files')
    op.drop_index('ix_uploaded_files_user_id', table_name='uploaded_files')

    # Drop table
    op.drop_table('uploaded_files')
