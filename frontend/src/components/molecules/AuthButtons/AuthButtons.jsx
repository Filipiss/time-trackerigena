import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import LoginModal from '../../organisms/LoginModal/LoginModal';
import RegisterModal from '../../organisms/RegisterModal/RegisterModal';
import ForgotPasswordModal from '../../organisms/ForgotPasswordModal/ForgotPasswordModal';
import './AuthButtons.css';

export default function AuthButtons() {
    const { user } = useAuth();

    const [modal, setModal] = useState(null);

    if (user) return null;

    return (
        <>
            <div className="c-auth-buttons">
                <span className="c-auth-buttons__guest-indicator">Modo Visitante</span>
                <button
                    id="btn-login"
                    className="c-auth-buttons__btn c-auth-buttons__btn--ghost"
                    onClick={() => setModal('login')}
                >
                    Entrar
                </button>
                <button
                    id="btn-register"
                    className="c-auth-buttons__btn c-auth-buttons__btn--primary"
                    onClick={() => setModal('register')}
                >
                    Cadastrar
                </button>
            </div>

            {modal === 'login' && (
                <LoginModal
                    onClose={() => setModal(null)}
                    onSwitchToRegister={() => setModal('register')}
                    onForgotPassword={() => setModal('forgot')}
                />
            )}
            {modal === 'register' && (
                <RegisterModal
                    onClose={() => setModal(null)}
                    onSwitchToLogin={() => setModal('login')}
                />
            )}
            {modal === 'forgot' && (
                <ForgotPasswordModal
                    onClose={() => setModal(null)}
                    onSwitchToLogin={() => setModal('login')}
                />
            )}
        </>
    );
}
