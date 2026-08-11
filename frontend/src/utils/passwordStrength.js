/**
 * Validação de força de senha — mirrored do backend (utils/password.py)
 * Retorna { score: 0-5, errors: string[] }
 */
export function validate_password_strength_js(password) {
    const rules = [
        { fn: (p) => p.length >= 8, msg: 'Mínimo 8 caracteres' },
        { fn: (p) => /[a-z]/.test(p), msg: 'Pelo menos uma letra minúscula' },
        { fn: (p) => /[A-Z]/.test(p), msg: 'Pelo menos uma letra maiúscula' },
        { fn: (p) => /\d/.test(p), msg: 'Pelo menos um número' },
        { fn: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p), msg: 'Pelo menos um caractere especial' },
    ];

    const errors = rules.filter(r => !r.fn(password)).map(r => r.msg);
    const score = rules.length - errors.length;
    return { score, errors };
}
