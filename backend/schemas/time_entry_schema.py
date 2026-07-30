from marshmallow import Schema, fields


class TimeEntrySchema(Schema):
    """Schema Marshmallow para TimeEntry."""

    id = fields.Int(dump_only=True)
    task_id = fields.Int(required=True)
    start_time = fields.DateTime(required=True)
    end_time = fields.DateTime(load_default=None, allow_none=True)
    duration_seconds = fields.Int(required=True)
    notes = fields.Str(load_default=None, allow_none=True)
    created_at = fields.DateTime(dump_only=True)

    # Campos extras de leitura
    task_name = fields.Str(dump_only=True, load_default=None)
    task_category = fields.Str(dump_only=True, load_default=None)
    task_color = fields.Str(dump_only=True, load_default=None)
    task_hourly_rate = fields.Float(dump_only=True, load_default=0.0)
    project_name = fields.Str(dump_only=True, load_default=None)


# ─── Stats Schemas ──────────────────────────────────────────────────────────────


class CategoryStatSchema(Schema):
    category = fields.Str()
    total_seconds = fields.Int()


class TaskStatSchema(Schema):
    task_name = fields.Str()
    task_color = fields.Str()
    category = fields.Str()
    total_seconds = fields.Int()


class DayStatSchema(Schema):
    date = fields.Str()
    total_seconds = fields.Int()


class StatsResponseSchema(Schema):
    total_seconds = fields.Int()
    time_by_category = fields.List(fields.Nested(CategoryStatSchema))
    time_by_task = fields.List(fields.Nested(TaskStatSchema))
    time_by_day = fields.List(fields.Nested(DayStatSchema))
