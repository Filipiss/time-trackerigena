import { useState } from 'react';
import { createPortal } from 'react-dom';
import { apiForgotPassword } from '../../../api';
import '../LoginModal/LoginModal.css';

export default function ForgotPasswordModal({ onClose, onSwitchToLogin }) {
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        if (!identifier.trim()) { setError('Informe seu e-mail ou username'); return; }
        setLoading(true);
        setError('');
        try {
            await apiForgotPassword(identifier.trim());
            setSent(true);
        } catch (err) {
            setError(err.message || 'Erro ao enviar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    return createPortal(
        <div className="c-modal-overlay">
            <div className="c-modal">
                <button className="c-modal__close" onClick={onClose}>✕</button>

                {sent ? (
                    <div className="c-modal__success">
                        <span className="c-modal__success-icon">📧</span>
                        <h2>E-mail enviado!</h2>
                        <p>Se o e-mail/usuário existir, você receberá um link válido por 1 hora para redefinir sua senha.</p>
                        <button className="c-modal__btn--primary" onClick={onSwitchToLogin}>Voltar ao login</button>
                    </div>
                ) : (
                    <>
                        <h2 className="c-modal__title">Esqueci minha senha</h2>
                        <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>
                            Informe seu e-mail ou username cadastrado e enviaremos um link de recuperação.
                        </p>

                        {error && <div className="c-modal__error">{error}</div>}

                        <form onSubmit={handleSubmit} className="c-modal__form">
                            <div className="c-modal__field-group">
                                <label>E-mail ou usuário</label>
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={e => { setIdentifier(e.target.value); setError(''); }}
                                    placeholder="seu@email.com ou username"
                                    autoFocus
                                />
                            </div>

                            <button type="submit" className="c-modal__btn--primary" disabled={loading}>
                                {loading ? 'Enviando…' : 'Enviar link de recuperação'}
                            </button>
                        </form>

                        <p className="c-modal__footer-link">
                            Lembrou a senha? <button type="button" className="c-modal__link-btn" onClick={onSwitchToLogin}>Voltar ao login</button>
                        </p>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}
