"""initial schema (7 core tables)

Revision ID: 0001
Revises:
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("full_name", sa.String(255)),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", sa.String(32), nullable=False, server_default="engineer"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "services",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(128), nullable=False, unique=True),
        sa.Column("description", sa.Text),
        sa.Column("owner", sa.String(128)),
        sa.Column("status", sa.String(32), nullable=False, server_default="unknown"),
        sa.Column("environment", sa.String(32), nullable=False, server_default="prod"),
        sa.Column("error_threshold", sa.Integer, nullable=False, server_default="5"),
        sa.Column("window_seconds", sa.Integer, nullable=False, server_default="60"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_services_name", "services", ["name"], unique=True)

    op.create_table(
        "logs",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column(
            "service_id",
            sa.Integer,
            sa.ForeignKey("services.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("level", sa.String(16), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("trace_id", sa.String(64)),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_logs_service_timestamp", "logs", ["service_id", "timestamp"])
    op.create_index("ix_logs_level", "logs", ["level"])
    op.create_index("ix_logs_trace_id", "logs", ["trace_id"])

    op.create_table(
        "incidents",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "service_id",
            sa.Integer,
            sa.ForeignKey("services.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("severity", sa.String(16), nullable=False, server_default="high"),
        sa.Column("status", sa.String(16), nullable=False, server_default="open"),
        sa.Column("assigned_to", sa.Integer, sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("resolution_notes", sa.Text),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("resolved_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_incidents_service_status", "incidents", ["service_id", "status"])
    op.create_index("ix_incidents_created_at", "incidents", ["created_at"])

    op.create_table(
        "incident_summaries",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "incident_id",
            sa.Integer,
            sa.ForeignKey("incidents.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("ai_summary", sa.Text, nullable=False),
        sa.Column("possible_root_cause", sa.Text, nullable=False),
        sa.Column("recommended_steps", sa.Text, nullable=False),
        sa.Column("confidence_score", sa.Float, nullable=False, server_default="0"),
        sa.Column("model_used", sa.String(128)),
        sa.Column("feedback_score", sa.Integer),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_table(
        "deployments",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "service_id",
            sa.Integer,
            sa.ForeignKey("services.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("version", sa.String(64), nullable=False),
        sa.Column("commit_id", sa.String(64)),
        sa.Column("status", sa.String(32), nullable=False, server_default="success"),
        sa.Column(
            "deployed_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_deployments_service_deployed", "deployments", ["service_id", "deployed_at"])

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("incident_id", sa.Integer, sa.ForeignKey("incidents.id", ondelete="SET NULL")),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("channel", sa.String(32), nullable=False),
        sa.Column("target", sa.String(255), nullable=False),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("sent", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("error", sa.Text),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("deployments")
    op.drop_table("incident_summaries")
    op.drop_table("incidents")
    op.drop_table("logs")
    op.drop_table("services")
    op.drop_table("users")
