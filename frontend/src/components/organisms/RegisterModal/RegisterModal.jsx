import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { validate_password_strength_js } from '../../../utils/passwordStrength';
import { CheckCircle, Check, Circle } from 'lucide-react';
import './RegisterModal.css';

export default function RegisterModal({ onClose, onSwitchToLogin }) {
    const { register } = useAuth();
    const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '', phone: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [serverError, setServerError] = useState('');
    const [strength, setStrength] = useState({ score: 0, errors: [] });

    const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;

    useEffect(() => {
        if (form.password) {
            setStrength(validate_password_strength_js(form.password));
        } else {
            setStrength({ score: 0, errors: [] });
        }
    }, [form.password]);

    function validate() {
        const e = {};
        if (!form.username) e.username = 'Username obrigatório';
        else if (!USERNAME_REGEX.test(form.username)) e.username = 'Apenas letras e números, sem espaço';
        else if (form.username.length < 3) e.username = 'Mínimo 3 caracteres';

        if (!form.email) e.email = 'E-mail obrigatório';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido';

        const pwdErrs = validate_password_strength_js(form.password).errors;
        if (pwdErrs.length) e.password = pwdErrs[0];

        if (form.password !== form.confirm) e.confirm = 'As senhas não coincidem';

        return e;
    }

    function handleChange(e) {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
        setErrors(er => ({ ...er, [e.target.name]: undefined }));
        setServerError('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setLoading(true);
        try {
            await register(form.username, form.email, form.password, form.phone || null);
            setSuccess(true);
        } catch (err) {
            setServerError(err.message || 'Erro ao cadastrar');
        } finally {
            setLoading(false);
        }
    }

    const strengthLabel = ['', 'Fraca', 'Média', 'Boa', 'Forte', 'Muito forte'][strength.score] || '';
    const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][strength.score] || '#444';
    const rules = [
        { label: 'Mínimo 8 caracteres', ok: form.password.length >= 8 },
        { label: 'Letra minúscula', ok: /[a-z]/.test(form.password) },
        { label: 'Letra maiúscula', ok: /[A-Z]/.test(form.password) },
        { label: 'Número', ok: /\d/.test(form.password) },
        { label: 'Caractere especial', ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) },
    ];

    if (success) return createPortal(
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-success">
                    <span className="success-icon" style={{ color: 'var(--color-success)', display: 'flex', justifyContent: 'center' }}>
                        <CheckCircle size={48} strokeWidth={1.5} />
                    </span>
                    <h2>Cadastro realizado!</h2>
                    <p>Verifique seu e-mail para ativar a conta antes de fazer login.</p>
                    <button className="c-btn--primary" onClick={onSwitchToLogin}>Ir para o Login</button>
                </div>
            </div>
        </div>,
        document.body
    );

    return createPortal(
        <div className="modal-overlay">
            <div className="modal-box">
                <button className="modal-close" onClick={onClose}>✕</button>
                <h2 className="modal-title">Criar conta</h2>

                {serverError && <div className="modal-error">{serverError}</div>}

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="field-group">
                        <label>Username</label>
                        <input name="username" value={form.username} onChange={handleChange}
                            placeholder="apenasletrasounumeros" autoComplete="username" />
                        {errors.username && <span className="field-error">{errors.username}</span>}
                    </div>

                    <div className="field-group">
                        <label>E-mail</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange}
                            placeholder="seu@email.com" autoComplete="email" />
                        {errors.email && <span className="field-error">{errors.email}</span>}
                    </div>

                    <div className="field-group">
                        <label>Senha</label>
                        <input name="password" type="password" value={form.password} onChange={handleChange}
                            placeholder="Senha segura" autoComplete="new-password" />
                        {form.password && (
                            <>
                                <div className="strength-bar-wrap">
                                    <div className="strength-bar" style={{ width: `${strength.score * 20}%`, background: strengthColor }} />
                                </div>
                                <span className="strength-label" style={{ color: strengthColor }}>{strengthLabel}</span>
                                <ul className="rules-list">
                                    {rules.map(r => (
                                        <li key={r.label} className={r.ok ? 'rule-ok' : 'rule-fail'}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                {r.ok ? <Check size={14} strokeWidth={2} /> : <Circle size={14} strokeWidth={1.5} />}
                                            </span> {r.label}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {errors.password && <span className="field-error">{errors.password}</span>}
                    </div>

                    <div className="field-group">
                        <label>Confirmar senha</label>
                        <input name="confirm" type="password" value={form.confirm} onChange={handleChange}
                            placeholder="Repita a senha" autoComplete="new-password" />
                        {errors.confirm && <span className="field-error">{errors.confirm}</span>}
                    </div>

                    <div className="field-group">
                        <label>Telefone <span style={{ color: '#666', fontWeight: 400 }}>(opcional)</span></label>
                        <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                            placeholder="+55 11 99999-9999" autoComplete="tel" />
                    </div>

                    <button type="submit" className="c-btn--primary" disabled={loading}>
                        {loading ? 'Criando conta…' : 'Criar conta'}
                    </button>
                </form>

                <p className="modal-footer-link">
                    Já tem conta? <button className="link-btn" onClick={onSwitchToLogin}>Entrar</button>
                </p>
            </div>
        </div>,
        document.body
    );
}
