from marshmallow import Schema, fields


class TaskSchema(Schema):
    """Schema Marshmallow para Task (criação e serialização)."""

    id = fields.Int(dump_only=True)
    project_id = fields.Int(required=True)
    name = fields.Str(required=True)
    color = fields.Str(load_default="#6366f1")
    hourly_rate = fields.Float(load_default=0.0)
    currency = fields.Str(load_default="EUR")
    budgeted_hours = fields.Float(load_default=None, allow_none=True)
    is_billed = fields.Bool(load_default=False)
    created_at = fields.DateTime(dump_only=True)
    is_active = fields.Bool(dump_only=True)

    deadline = fields.Str(load_default=None, allow_none=True)
    status = fields.Str(load_default="em_andamento")
    notes = fields.Str(load_default=None, allow_none=True)
    deadline_notified = fields.Bool(dump_only=True)

    # Campos extras de leitura (calculados no service/repository)
    total_time = fields.Int(dump_only=True, load_default=0)
    project_name = fields.Str(dump_only=True, load_default=None)
    project_category = fields.Str(dump_only=True, load_default=None)


class TaskUpdateSchema(Schema):
    """Schema Marshmallow para atualização parcial de Task."""

    project_id = fields.Int(load_default=None)
    name = fields.Str(load_default=None)
    color = fields.Str(load_default=None)
    is_active = fields.Bool(load_default=None)
    hourly_rate = fields.Float(load_default=None)
    currency = fields.Str(load_default=None)
    budgeted_hours = fields.Float(load_default=None, allow_none=True)
    is_billed = fields.Bool(load_default=None)

    deadline = fields.Str(load_default=None, allow_none=True)
    status = fields.Str(load_default=None)
    notes = fields.Str(load_default=None, allow_none=True)

class TaskDeadlineHistorySchema(Schema):
    """Schema para serialização de histórico de prazos de Task."""

    id = fields.Int(dump_only=True)
    task_id = fields.Int(dump_only=True)
    old_deadline = fields.Str()
    new_deadline = fields.Str()
    changed_at = fields.DateTime()
