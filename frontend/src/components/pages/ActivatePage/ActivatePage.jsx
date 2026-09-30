import { useEffect, useState } from 'react';
import { apiActivate } from '../../../api';
import './ActivatePage.css';

export default function ActivatePage({ token }) {
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) { setStatus('error'); setMessage('Token inválido.'); return; }
        apiActivate(token)
            .then(data => { setStatus('success'); setMessage(data.message || 'Conta ativada!'); })
            .catch(err => { setStatus('error'); setMessage(err.message || 'Erro ao ativar conta.'); });
    }, [token]);

    function goHome() {
        window.location.href = '/';
    }

    return (
        <div className="c-activate-page">
            <div className="c-activate-card">
                <span className="c-activate-card__logo">👽</span>
                <h1 className="c-activate-card__brand">Time Trackerígena</h1>

                {status === 'loading' && (
                    <>
                        <div className="c-activate-card__spinner" />
                        <p className="c-activate-card__msg">Ativando sua conta…</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <span className="c-activate-card__icon">✅</span>
                        <p className="c-activate-card__msg">{message}</p>
                        <button className="c-activate-card__btn" onClick={goHome}>Ir para o app</button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <span className="c-activate-card__icon">❌</span>
                        <p className="c-activate-card__msg">{message}</p>
                        <button className="c-activate-card__btn" onClick={goHome}>Voltar ao início</button>
                    </>
                )}
            </div>
        </div>
    );
}
