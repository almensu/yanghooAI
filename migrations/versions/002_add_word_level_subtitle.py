"""add word level subtitle

Revision ID: 002
Revises: 001
Create Date: 2024-03-17 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade():
    # 添加新列
    op.add_column('video', sa.Column('subtitle_en_with_words_json_path', sa.String(), nullable=True))
    op.add_column('videos', sa.Column('subtitle_en_with_words_json_path', sa.String(), nullable=True))

def downgrade():
    # 删除新列
    op.drop_column('video', 'subtitle_en_with_words_json_path')
    op.drop_column('videos', 'subtitle_en_with_words_json_path') 