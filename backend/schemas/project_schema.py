from marshmallow import Schema, fields, validates, ValidationError


class ProjectSchema(Schema):
    """Schema Marshmallow para Project."""

    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    category = fields.Str(required=True)
    created_at = fields.DateTime(dump_only=True)

    @validates("category")
    def validate_category(self, value):
        """Categoria deve ser 'Loco' ou 'Freelas'."""
        if value not in ("Loco", "Freelas"):
            raise ValidationError("Categoria deve ser 'Loco' ou 'Freelas'")


class ProjectUpdateSchema(Schema):
    """Schema Marshmallow para atualização parcial de Project."""

    name = fields.Str(load_default=None)
    category = fields.Str(load_default=None)

    @validates("category")
    def validate_category(self, value):
        if value is not None and value not in ("Loco", "Freelas"):
            raise ValidationError("Categoria deve ser 'Loco' ou 'Freelas'")
