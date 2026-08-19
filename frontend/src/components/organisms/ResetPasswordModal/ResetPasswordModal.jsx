import { useState } from 'react';
import { createPortal } from 'react-dom';
import { apiResetPassword } from '../../../api';
import { validate_password_strength_js } from '../../../utils/passwordStrength';
import { Eye, EyeOff, CheckCircle, Check, Circle } from 'lucide-react';

export default function ResetPasswordModal({ token, onClose, onSwitchToLogin }) {
    const [form, setForm] = useState({ password: '', confirm: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const strength = form.password ? validate_password_strength_js(form.password) : { score: 0, errors: [] };
    const strengthLabel = ['', 'Fraca', 'Média', 'Boa', 'Forte', 'Muito forte'][strength.score] || '';
    const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][strength.score] || '#444';
    const rules = [
        { label: 'Mínimo 8 caracteres', ok: form.password.length >= 8 },
        { label: 'Letra minúscula', ok: /[a-z]/.test(form.password) },
        { label: 'Letra maiúscula', ok: /[A-Z]/.test(form.password) },
        { label: 'Número', ok: /\d/.test(form.password) },
        { label: 'Caractere especial', ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) },
    ];

    async function handleSubmit(e) {
        e.preventDefault();
        if (strength.errors.length) { setError(strength.errors[0]); return; }
        if (form.password !== form.confirm) { setError('As senhas não coincidem'); return; }
        setLoading(true);
        setError('');
        try {
            await apiResetPassword(token, form.password);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Erro ao redefinir. O link pode ter expirado.');
        } finally {
            setLoading(false);
        }
    }

    return createPortal(
        <div className="modal-overlay">
            <div className="modal-box">
                <button className="modal-close" onClick={onClose}>✕</button>

                {success ? (
                    <div className="modal-success">
                        <span className="success-icon" style={{ color: 'var(--color-success)', display: 'flex', justifyContent: 'center' }}>
                            <CheckCircle size={48} strokeWidth={1.5} />
                        </span>
                        <h2>Senha redefinida!</h2>
                        <p>Sua nova senha foi salva. Faça login para continuar.</p>
                        <button className="c-btn--primary" onClick={onSwitchToLogin}>Ir para o login</button>
                    </div>
                ) : (
                    <>
                        <h2 className="modal-title">Nova senha</h2>
                        <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>
                            Crie uma senha forte para sua conta.
                        </p>

                        {error && <div className="modal-error">{error}</div>}

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="field-group">
                                <label>Nova senha</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setError(''); }}
                                        placeholder="Senha segura"
                                        autoComplete="new-password"
                                        autoFocus
                                    />
                                    <button type="button" className="password-toggle"
                                        onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                                        {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                                    </button>
                                </div>
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
                            </div>

                            <div className="field-group">
                                <label>Confirmar nova senha</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.confirm}
                                        onChange={e => { setForm(f => ({ ...f, confirm: e.target.value })); setError(''); }}
                                        placeholder="Repita a senha"
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="c-btn--primary" disabled={loading}>
                                {loading ? 'Salvando…' : 'Salvar nova senha'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}
