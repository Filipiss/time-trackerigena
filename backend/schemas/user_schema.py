import re

from marshmallow import Schema, fields, validate, validates, ValidationError

from utils.password import validate_password_strength


USERNAME_REGEX = r"^[a-zA-Z0-9]+$"


class RegisterSchema(Schema):
    username = fields.Str(
        required=True,
        validate=[
            validate.Length(min=3, max=50, error="Username deve ter entre 3 e 50 caracteres"),
            validate.Regexp(USERNAME_REGEX, error="Username deve conter apenas letras e números, sem espaços ou caracteres especiais"),
        ],
    )
    email = fields.Email(required=True, error_messages={"invalid": "E-mail inválido"})
    password = fields.Str(required=True, load_only=True)
    phone = fields.Str(validate=validate.Length(max=30), load_default=None, allow_none=True)

    @validates("password")
    def validate_password(self, value):
        errors = validate_password_strength(value)
        if errors:
            raise ValidationError(errors)


class LoginSchema(Schema):
    identifier = fields.Str(required=True, validate=validate.Length(min=1), error_messages={"required": "Informe e-mail ou username"})
    password = fields.Str(required=True, load_only=True)


class ForgotPasswordSchema(Schema):
    identifier = fields.Str(required=True, validate=validate.Length(min=1), error_messages={"required": "Informe e-mail ou username"})


class ResetPasswordSchema(Schema):
    token = fields.Str(required=True)
    new_password = fields.Str(required=True, load_only=True)

    @validates("new_password")
    def validate_new_password(self, value):
        errors = validate_password_strength(value)
        if errors:
            raise ValidationError(errors)


class ProfileUpdateSchema(Schema):
    full_name = fields.Str(validate=validate.Length(max=150), allow_none=True, load_default=None)
    country = fields.Str(validate=validate.Length(max=100), allow_none=True, load_default=None)
    avatar_url = fields.Str(allow_none=True, load_default=None)
    phone = fields.Str(validate=validate.Length(max=30), allow_none=True, load_default=None)


class ChangePasswordSchema(Schema):
    current_password = fields.Str(required=True, load_only=True)
    new_password = fields.Str(required=True, load_only=True)

    @validates("new_password")
    def validate_new_password(self, value):
        errors = validate_password_strength(value)
        if errors:
            raise ValidationError(errors)


class UserPublicSchema(Schema):
    id = fields.Int(dump_only=True)
    username = fields.Str(dump_only=True)
    email = fields.Email(dump_only=True)
    full_name = fields.Str(dump_only=True, allow_none=True)
    country = fields.Str(dump_only=True, allow_none=True)
    avatar_url = fields.Str(dump_only=True, allow_none=True)
    phone = fields.Str(dump_only=True, allow_none=True)
    is_active = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
