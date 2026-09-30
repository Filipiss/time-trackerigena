import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import './UserWidget.css';

export default function UserWidget({ onNavigateToProfile }) {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef(null);

    function handleMouseEnter() {
        clearTimeout(timeoutRef.current);
        if (user) setOpen(true);
    }
    function handleMouseLeave() {
        timeoutRef.current = setTimeout(() => setOpen(false), 180);
    }

    function handleProfile() {
        setOpen(false);
        onNavigateToProfile?.();
    }

    function handleLogout() {
        setOpen(false);
        logout();
    }

    if (!user) return null;

    const initials = (user.full_name || user.username || '?')
        .split(' ')
        .slice(0, 2)
        .map(s => s[0]?.toUpperCase())
        .join('');

    return (
        <div
            className="c-user-widget"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button className="c-user-widget__trigger" aria-label={t("Menu do usuário")}>
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="c-user-widget__avatar" />
                ) : (
                    <div className="c-user-widget__initials">{initials}</div>
                )}
                <span className="c-user-widget__name">{user.username}</span>
                <span className="c-user-widget__caret">▾</span>
            </button>

            {open && (
                <div className="c-user-widget__dropdown">
                    {user?.is_admin && (
                        <button className="c-user-widget__item" onClick={() => { setOpen(false); navigate('/admin'); }}>
                            <span>⚙️</span> {t("Painel Admin")}
                        </button>
                    )}
                    <button className="c-user-widget__item" onClick={handleProfile}>
                        <span>👤</span> {t("Perfil")}
                    </button>
                    <button className="c-user-widget__item c-user-widget__item--danger" onClick={handleLogout}>
                        <span>🚪</span> {t("Sair")}
                    </button>
                </div>
            )}
        </div>
    );
}
