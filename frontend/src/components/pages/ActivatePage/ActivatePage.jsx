import { useEffect, useState } from 'react';
import { apiActivate } from '../../../api';
import './ActivatePage.css';

export default function ActivatePage({ token }) {
    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
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
        <div className="activate-page">
            <div className="activate-card">
                <span className="activate-logo">👽</span>
                <h1 className="activate-brand">Time Trackerígena</h1>

                {status === 'loading' && (
                    <>
                        <div className="activate-spinner" />
                        <p className="activate-msg">Ativando sua conta…</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <span className="activate-icon">✅</span>
                        <p className="activate-msg">{message}</p>
                        <button className="activate-btn" onClick={goHome}>Ir para o app</button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <span className="activate-icon">❌</span>
                        <p className="activate-msg">{message}</p>
                        <button className="activate-btn" onClick={goHome}>Voltar ao início</button>
                    </>
                )}
            </div>
        </div>
    );
}
