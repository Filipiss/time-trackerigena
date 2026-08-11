from marshmallow import Schema, fields


class ProjectSchema(Schema):
    """Schema Marshmallow para Project."""

    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    category = fields.Str(required=True)
    created_at = fields.DateTime(dump_only=True)

    # Campos do calendário de deadlines
    deadline = fields.Str(load_default=None, allow_none=True)
    status = fields.Str(load_default="em_andamento", allow_none=True)
    notes = fields.Str(load_default=None, allow_none=True)


class ProjectUpdateSchema(Schema):
    """Schema Marshmallow para atualização parcial de Project."""

    name = fields.Str(load_default=None)
    category = fields.Str(load_default=None)
    deadline = fields.Str(load_default=None, allow_none=True)
    status = fields.Str(load_default=None, allow_none=True)
    notes = fields.Str(load_default=None, allow_none=True)


class ProjectDeadlineHistorySchema(Schema):
    """Schema Marshmallow para histórico de alterações de deadline."""

    id = fields.Int(dump_only=True)
    project_id = fields.Int(dump_only=True)
    old_deadline = fields.Str(dump_only=True, allow_none=True)
    new_deadline = fields.Str(dump_only=True, allow_none=True)
    changed_at = fields.DateTime(dump_only=True)

class ProjectAttachmentSchema(Schema):
    id = fields.Int(dump_only=True)
    project_id = fields.Int(dump_only=True)
    file_name = fields.Str(required=True)
    file_url = fields.Str(required=True)
    file_size = fields.Int(allow_none=True)
    color = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
