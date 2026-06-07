"""add_image_url_to_products

Revision ID: a1b2c3d4e5f6
Revises: b74e89a30e54
Create Date: 2026-06-05 16:00:00.000000

"""
from typing import Sequence, Union

import sqlmodel  # noqa: F401
from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'b74e89a30e54'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('image_url', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('products', 'image_url')
