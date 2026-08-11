import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../contexts/AuthContext';
import './LoginModal.css';

export default function LoginModal({ onClose, onSwitchToRegister, onForgotPassword }) {
    const { login } = useAuth();
    const [form, setForm] = useState({ identifier: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
        setError('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.identifier || !form.password) { setError('Preencha e-mail/usuário e senha'); return; }
        setLoading(true);
        try {
            await login(form.identifier, form.password);
            onClose();
        } catch (err) {
            setError(err.message || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    }

    return createPortal(
        <div className="modal-overlay">
            <div className="modal-box">
                <button className="modal-close" onClick={onClose}>✕</button>
                <h2 className="modal-title">Entrar</h2>

                {error && <div className="modal-error">{error}</div>}

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="field-group">
                        <label>E-mail ou usuário</label>
                        <input
                            name="identifier"
                            type="text"
                            value={form.identifier}
                            onChange={handleChange}
                            placeholder="seu@email.com ou username"
                            autoComplete="username"
                            autoFocus
                        />
                    </div>

                    <div className="field-group">
                        <label>Senha</label>
                        <div className="password-wrapper">
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Sua senha"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(v => !v)}
                                tabIndex={-1}
                                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {onForgotPassword && (
                            <button
                                type="button"
                                className="link-btn forgot-link"
                                onClick={onForgotPassword}
                            >
                                Esqueci minha senha
                            </button>
                        )}
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Entrando…' : 'Entrar'}
                    </button>
                </form>

                <p className="modal-footer-link">
                    Não tem conta? <button className="link-btn" onClick={onSwitchToRegister}>Criar conta</button>
                </p>
            </div>
        </div>,
        document.body
    );
}
