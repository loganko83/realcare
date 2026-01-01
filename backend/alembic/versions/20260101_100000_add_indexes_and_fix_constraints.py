"""Add missing indexes and fix FK constraints

Revision ID: 005
Revises: 004
Create Date: 2026-01-01 10:00:00

This migration:
1. Adds missing indexes on signal_interests table (signal_id, user_id)
2. Adds index on agent_signal_responses.created_at for sorting
3. Adds index on agent_listings (created_at, is_active)
4. Changes payments.user_id FK from CASCADE to RESTRICT (legal compliance)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add missing indexes on signal_interests table
    op.create_index(
        'ix_signal_interests_signal_id',
        'signal_interests',
        ['signal_id']
    )
    op.create_index(
        'ix_signal_interests_user_id',
        'signal_interests',
        ['user_id']
    )

    # 2. Add index on agent_signal_responses.created_at
    op.create_index(
        'ix_agent_signal_responses_created_at',
        'agent_signal_responses',
        ['created_at']
    )

    # 3. Add indexes on agent_listings for common queries
    op.create_index(
        'ix_agent_listings_created_at',
        'agent_listings',
        ['created_at']
    )
    op.create_index(
        'ix_agent_listings_is_active',
        'agent_listings',
        ['is_active']
    )

    # 4. Fix payments.user_id FK - change from CASCADE to RESTRICT
    # Drop existing FK constraint
    op.drop_constraint(
        'payments_user_id_fkey',
        'payments',
        type_='foreignkey'
    )
    # Recreate with RESTRICT to prevent payment history loss
    op.create_foreign_key(
        'payments_user_id_fkey',
        'payments',
        'users',
        ['user_id'],
        ['id'],
        ondelete='RESTRICT'
    )


def downgrade() -> None:
    # Revert payments FK back to CASCADE
    op.drop_constraint(
        'payments_user_id_fkey',
        'payments',
        type_='foreignkey'
    )
    op.create_foreign_key(
        'payments_user_id_fkey',
        'payments',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # Drop indexes
    op.drop_index('ix_agent_listings_is_active', table_name='agent_listings')
    op.drop_index('ix_agent_listings_created_at', table_name='agent_listings')
    op.drop_index('ix_agent_signal_responses_created_at', table_name='agent_signal_responses')
    op.drop_index('ix_signal_interests_user_id', table_name='signal_interests')
    op.drop_index('ix_signal_interests_signal_id', table_name='signal_interests')
