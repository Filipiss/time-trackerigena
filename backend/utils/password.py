import re


# Regras de senha segura
PASSWORD_MIN_LENGTH = 8
PASSWORD_RULES = [
    (lambda p: len(p) >= PASSWORD_MIN_LENGTH, f"Mínimo {PASSWORD_MIN_LENGTH} caracteres"),
    (lambda p: bool(re.search(r"[a-z]", p)), "Pelo menos uma letra minúscula"),
    (lambda p: bool(re.search(r"[A-Z]", p)), "Pelo menos uma letra maiúscula"),
    (lambda p: bool(re.search(r"\d", p)), "Pelo menos um número"),
    (lambda p: bool(re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", p)), "Pelo menos um caractere especial"),
]


def validate_password_strength(password: str) -> list[str]:
    """Retorna lista de erros. Lista vazia = senha válida."""
    errors = []
    for rule_fn, message in PASSWORD_RULES:
        if not rule_fn(password):
            errors.append(message)
    return errors


def is_password_strong(password: str) -> bool:
    return len(validate_password_strength(password)) == 0


def get_password_rules_description() -> list[str]:
    return [message for _, message in PASSWORD_RULES]
