import { useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import './UserWidget.css';

export default function UserWidget({ onNavigateToProfile }) {
    const { user, logout } = useAuth();
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
            className="user-widget"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button className="user-widget-trigger" aria-label="Menu do usuário">
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="user-avatar" />
                ) : (
                    <div className="user-avatar-initials">{initials}</div>
                )}
                <span className="user-widget-name">{user.username}</span>
                <span className="user-widget-caret">▾</span>
            </button>

            {open && (
                <div className="user-dropdown">
                    <button className="dropdown-item" onClick={handleProfile}>
                        <span>👤</span> Perfil
                    </button>
                    <button className="dropdown-item dropdown-item--danger" onClick={handleLogout}>
                        <span>🚪</span> Sair
                    </button>
                </div>
            )}
        </div>
    );
}
