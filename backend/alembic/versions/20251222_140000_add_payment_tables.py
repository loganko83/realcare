"""Add payment tables

Revision ID: 003
Revises: 002
Create Date: 2025-12-22 14:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create payments table
    op.create_table('payments',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(10), nullable=False, server_default='KRW'),
        sa.Column('method', sa.Enum('CARD', 'BANK_TRANSFER', 'KAKAO_PAY', 'NAVER_PAY', 'TOSS_PAY', name='paymentmethod'), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', name='paymentstatus'), nullable=False),
        sa.Column('product_type', sa.String(50), nullable=False),
        sa.Column('product_id', sa.String(255), nullable=True),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('gateway', sa.String(50), nullable=True),
        sa.Column('gateway_tx_id', sa.String(255), nullable=True),
        sa.Column('gateway_response', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('refunded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create subscriptions table
    op.create_table('subscriptions',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('plan', sa.Enum('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE', name='subscriptionplan'), nullable=False),
        sa.Column('billing_cycle', sa.String(20), nullable=False, server_default='monthly'),
        sa.Column('price', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('auto_renew', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_payment_id', sa.String(255), nullable=True),
        sa.Column('next_billing_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('features', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_payments_user_id', 'payments', ['user_id'])
    op.create_index('ix_payments_status', 'payments', ['status'])
    op.create_index('ix_subscriptions_user_id', 'subscriptions', ['user_id'])
    op.create_index('ix_subscriptions_is_active', 'subscriptions', ['is_active'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_subscriptions_is_active', table_name='subscriptions')
    op.drop_index('ix_subscriptions_user_id', table_name='subscriptions')
    op.drop_index('ix_payments_status', table_name='payments')
    op.drop_index('ix_payments_user_id', table_name='payments')

    # Drop tables
    op.drop_table('subscriptions')
    op.drop_table('payments')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS subscriptionplan')
    op.execute('DROP TYPE IF EXISTS paymentstatus')
    op.execute('DROP TYPE IF EXISTS paymentmethod')
