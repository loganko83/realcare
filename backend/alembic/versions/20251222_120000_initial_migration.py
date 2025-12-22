"""Initial migration

Revision ID: 001
Revises:
Create Date: 2025-12-22 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('role', sa.Enum('USER', 'AGENT', 'ADMIN', name='userrole'), nullable=False),
        sa.Column('auth_provider', sa.Enum('EMAIL', 'KAKAO', 'NAVER', 'GOOGLE', name='authprovider'), nullable=False),
        sa.Column('provider_id', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('did_id', sa.String(255), nullable=True),
        sa.Column('wallet_address', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # Create reality_reports table
    op.create_table('reality_reports',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('property_name', sa.String(255), nullable=True),
        sa.Column('property_address', sa.String(500), nullable=True),
        sa.Column('property_price', sa.Integer(), nullable=False),
        sa.Column('transaction_type', sa.Enum('SALE', 'JEONSE', 'MONTHLY_RENT', name='transactiontype'), nullable=False),
        sa.Column('region', sa.String(100), nullable=False),
        sa.Column('annual_income', sa.Integer(), nullable=False),
        sa.Column('available_cash', sa.Integer(), nullable=False),
        sa.Column('existing_debt', sa.Integer(), nullable=False),
        sa.Column('monthly_expenses', sa.Integer(), nullable=False),
        sa.Column('house_count', sa.Integer(), nullable=False),
        sa.Column('reality_score', sa.Integer(), nullable=False),
        sa.Column('ltv_ratio', sa.Numeric(5, 2), nullable=False),
        sa.Column('dsr_ratio', sa.Numeric(5, 2), nullable=False),
        sa.Column('max_loan', sa.Integer(), nullable=False),
        sa.Column('required_cash', sa.Integer(), nullable=False),
        sa.Column('cash_gap', sa.Integer(), nullable=False),
        sa.Column('monthly_payment', sa.Integer(), nullable=False),
        sa.Column('score_breakdown', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('recommendations', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create owner_signals table
    op.create_table('owner_signals',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('property_type', sa.Enum('APARTMENT', 'VILLA', 'OFFICETEL', 'HOUSE', 'COMMERCIAL', 'LAND', name='propertytype'), nullable=False),
        sa.Column('property_address', sa.String(500), nullable=False),
        sa.Column('property_size', sa.Numeric(10, 2), nullable=True),
        sa.Column('floor', sa.Integer(), nullable=True),
        sa.Column('total_floors', sa.Integer(), nullable=True),
        sa.Column('built_year', sa.Integer(), nullable=True),
        sa.Column('latitude', sa.Numeric(10, 8), nullable=True),
        sa.Column('longitude', sa.Numeric(11, 8), nullable=True),
        sa.Column('region', sa.String(100), nullable=False),
        sa.Column('district', sa.String(100), nullable=True),
        sa.Column('asking_price', sa.Integer(), nullable=False),
        sa.Column('is_negotiable', sa.Boolean(), nullable=False),
        sa.Column('min_acceptable_price', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'PAUSED', 'MATCHED', 'COMPLETED', 'EXPIRED', name='signalstatus'), nullable=False),
        sa.Column('is_anonymous', sa.Boolean(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('description', sa.String(2000), nullable=True),
        sa.Column('features', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('images', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('verification_doc_hash', sa.String(255), nullable=True),
        sa.Column('view_count', sa.Integer(), nullable=False),
        sa.Column('interest_count', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create signal_interests table
    op.create_table('signal_interests',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('signal_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('message', sa.String(1000), nullable=True),
        sa.Column('offered_price', sa.Integer(), nullable=True),
        sa.Column('is_agent', sa.Boolean(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['signal_id'], ['owner_signals.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create contracts table
    op.create_table('contracts',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('contract_type', sa.Enum('SALE', 'JEONSE', 'MONTHLY_RENT', name='contracttype'), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', name='contractstatus'), nullable=False),
        sa.Column('property_address', sa.String(500), nullable=False),
        sa.Column('property_description', sa.String(1000), nullable=True),
        sa.Column('contract_date', sa.Date(), nullable=True),
        sa.Column('move_in_date', sa.Date(), nullable=True),
        sa.Column('move_out_date', sa.Date(), nullable=True),
        sa.Column('total_price', sa.Integer(), nullable=False),
        sa.Column('deposit', sa.Integer(), nullable=True),
        sa.Column('monthly_rent', sa.Integer(), nullable=True),
        sa.Column('loan_amount', sa.Integer(), nullable=True),
        sa.Column('risk_score', sa.Integer(), nullable=True),
        sa.Column('analysis_result', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('identified_risks', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('recommendations', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('contract_file_hash', sa.String(255), nullable=True),
        sa.Column('contract_file_url', sa.String(500), nullable=True),
        sa.Column('has_loan', sa.Boolean(), nullable=False),
        sa.Column('has_interior_work', sa.Boolean(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('blockchain_tx_hash', sa.String(255), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create timeline_tasks table
    op.create_table('timeline_tasks',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('contract_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.String(1000), nullable=True),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('priority', sa.String(20), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('d_day_offset', sa.Integer(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_completed', sa.Boolean(), nullable=False),
        sa.Column('is_optional', sa.Boolean(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['contract_id'], ['contracts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_reality_reports_user_id', 'reality_reports', ['user_id'])
    op.create_index('ix_owner_signals_user_id', 'owner_signals', ['user_id'])
    op.create_index('ix_owner_signals_region', 'owner_signals', ['region'])
    op.create_index('ix_owner_signals_status', 'owner_signals', ['status'])
    op.create_index('ix_contracts_user_id', 'contracts', ['user_id'])
    op.create_index('ix_timeline_tasks_contract_id', 'timeline_tasks', ['contract_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_timeline_tasks_contract_id', table_name='timeline_tasks')
    op.drop_index('ix_contracts_user_id', table_name='contracts')
    op.drop_index('ix_owner_signals_status', table_name='owner_signals')
    op.drop_index('ix_owner_signals_region', table_name='owner_signals')
    op.drop_index('ix_owner_signals_user_id', table_name='owner_signals')
    op.drop_index('ix_reality_reports_user_id', table_name='reality_reports')
    op.drop_index('ix_users_email', table_name='users')

    # Drop tables
    op.drop_table('timeline_tasks')
    op.drop_table('contracts')
    op.drop_table('signal_interests')
    op.drop_table('owner_signals')
    op.drop_table('reality_reports')
    op.drop_table('users')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS contractstatus')
    op.execute('DROP TYPE IF EXISTS contracttype')
    op.execute('DROP TYPE IF EXISTS signalstatus')
    op.execute('DROP TYPE IF EXISTS propertytype')
    op.execute('DROP TYPE IF EXISTS transactiontype')
    op.execute('DROP TYPE IF EXISTS authprovider')
    op.execute('DROP TYPE IF EXISTS userrole')
