"""Add agent tables

Revision ID: 002
Revises: 001
Create Date: 2025-12-22 13:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create agents table
    op.create_table('agents',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('business_name', sa.String(255), nullable=False),
        sa.Column('business_number', sa.String(20), nullable=False),
        sa.Column('license_number', sa.String(50), nullable=False),
        sa.Column('representative_name', sa.String(100), nullable=False),
        sa.Column('office_phone', sa.String(20), nullable=True),
        sa.Column('office_address', sa.String(500), nullable=False),
        sa.Column('office_region', sa.String(100), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED', name='agentstatus'), nullable=False),
        sa.Column('tier', sa.Enum('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE', name='agenttier'), nullable=False),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verification_doc_url', sa.String(500), nullable=True),
        sa.Column('introduction', sa.Text(), nullable=True),
        sa.Column('specialties', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('profile_image_url', sa.String(500), nullable=True),
        sa.Column('total_deals', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('success_rate', sa.Integer(), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('review_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('subscription_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('monthly_signal_limit', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('signals_used_this_month', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
        sa.UniqueConstraint('business_number'),
        sa.UniqueConstraint('license_number')
    )

    # Create agent_listings table
    op.create_table('agent_listings',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('agent_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('property_type', sa.String(50), nullable=False),
        sa.Column('transaction_type', sa.String(50), nullable=False),
        sa.Column('address', sa.String(500), nullable=False),
        sa.Column('region', sa.String(100), nullable=False),
        sa.Column('price', sa.Integer(), nullable=False),
        sa.Column('deposit', sa.Integer(), nullable=True),
        sa.Column('monthly_rent', sa.Integer(), nullable=True),
        sa.Column('size_sqm', sa.Integer(), nullable=True),
        sa.Column('rooms', sa.Integer(), nullable=True),
        sa.Column('bathrooms', sa.Integer(), nullable=True),
        sa.Column('floor', sa.Integer(), nullable=True),
        sa.Column('total_floors', sa.Integer(), nullable=True),
        sa.Column('built_year', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('features', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('images', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('inquiry_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create agent_signal_responses table
    op.create_table('agent_signal_responses',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('agent_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('signal_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('proposed_price', sa.Integer(), nullable=True),
        sa.Column('commission_rate', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('owner_response', sa.Text(), nullable=True),
        sa.Column('owner_responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['signal_id'], ['owner_signals.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_agents_user_id', 'agents', ['user_id'], unique=True)
    op.create_index('ix_agents_office_region', 'agents', ['office_region'])
    op.create_index('ix_agents_status', 'agents', ['status'])
    op.create_index('ix_agent_listings_agent_id', 'agent_listings', ['agent_id'])
    op.create_index('ix_agent_listings_region', 'agent_listings', ['region'])
    op.create_index('ix_agent_signal_responses_agent_id', 'agent_signal_responses', ['agent_id'])
    op.create_index('ix_agent_signal_responses_signal_id', 'agent_signal_responses', ['signal_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_agent_signal_responses_signal_id', table_name='agent_signal_responses')
    op.drop_index('ix_agent_signal_responses_agent_id', table_name='agent_signal_responses')
    op.drop_index('ix_agent_listings_region', table_name='agent_listings')
    op.drop_index('ix_agent_listings_agent_id', table_name='agent_listings')
    op.drop_index('ix_agents_status', table_name='agents')
    op.drop_index('ix_agents_office_region', table_name='agents')
    op.drop_index('ix_agents_user_id', table_name='agents')

    # Drop tables
    op.drop_table('agent_signal_responses')
    op.drop_table('agent_listings')
    op.drop_table('agents')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS agenttier')
    op.execute('DROP TYPE IF EXISTS agentstatus')
