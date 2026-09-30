import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
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
        <div className="c-modal-overlay">
            <div className="c-modal">
                <button className="c-modal__close" onClick={onClose}>✕</button>
                <h2 className="c-modal__title">Entrar</h2>

                {error && <div className="c-modal__error">{error}</div>}

                <form onSubmit={handleSubmit} className="c-modal__form">
                    <div className="c-modal__field-group">
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

                    <div className="c-modal__field-group">
                        <label>Senha</label>
                        <div className="c-modal__password-wrapper">
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
                                className="c-modal__password-toggle"
                                onClick={() => setShowPassword(v => !v)}
                                tabIndex={-1}
                                aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {onForgotPassword && (
                            <button
                                type="button"
                                className="c-modal__link-btn c-modal__forgot-link"
                                onClick={onForgotPassword}
                            >
                                Esqueceu a senha?
                            </button>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="c-modal__btn--primary"
                        disabled={loading}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <p className="c-modal__footer-link">
                    Não tem uma conta?{' '}
                    <button type="button" className="c-modal__link-btn" onClick={onSwitchToRegister}>
                        Cadastre-se
                    </button>
                </p>
            </div>
        </div>,
        document.body
    );
}
