from marshmallow import Schema, fields


class TaskSchema(Schema):
    """Schema Marshmallow para Task (criação e serialização)."""

    id = fields.Int(dump_only=True)
    project_id = fields.Int(required=True)
    name = fields.Str(required=True)
    color = fields.Str(load_default="#6366f1")
    hourly_rate = fields.Float(load_default=0.0)
    is_billed = fields.Bool(load_default=False)
    created_at = fields.DateTime(dump_only=True)
    is_active = fields.Bool(dump_only=True)

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
    is_billed = fields.Bool(load_default=None)
