import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import LoginModal from '../../organisms/LoginModal/LoginModal';
import RegisterModal from '../../organisms/RegisterModal/RegisterModal';
import ForgotPasswordModal from '../../organisms/ForgotPasswordModal/ForgotPasswordModal';
import './AuthButtons.css';

export default function AuthButtons() {
    const { user } = useAuth();
    // null | 'login' | 'register' | 'forgot'
    const [modal, setModal] = useState(null);

    if (user) return null; // Logado — não exibe botões

    return (
        <>
            <div className="auth-buttons">
                <button
                    id="btn-login"
                    className="auth-btn auth-btn--ghost"
                    onClick={() => setModal('login')}
                >
                    Entrar
                </button>
                <button
                    id="btn-register"
                    className="auth-btn auth-btn--primary"
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
