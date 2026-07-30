from marshmallow import Schema, fields


class ProjectSchema(Schema):
    """Schema Marshmallow para Project."""

    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    category = fields.Str(required=True)
    created_at = fields.DateTime(dump_only=True)



class ProjectUpdateSchema(Schema):
    """Schema Marshmallow para atualização parcial de Project."""

    name = fields.Str(load_default=None)
    category = fields.Str(load_default=None)
