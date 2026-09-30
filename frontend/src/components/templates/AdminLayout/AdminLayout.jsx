import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import './AdminLayout.css';

export default function AdminLayout() {
    const { user, loading } = useAuth();
    const { t } = useLanguage();

    if (loading) return <div className="l-admin-layout__loader">Acessando interface restrita...</div>;
    if (!user || user.is_admin !== true) return <Navigate to="/" replace />;

    return (
        <div className="l-admin-layout">
            <aside className="l-admin-layout__sidebar">
                <div className="l-admin-layout__sidebar-header">
                    <h2>{t("Painel Admin")}</h2>
                    <span className="c-admin-badge">Admin {user.username}</span>
                </div>
                <nav className="l-admin-layout__nav">
                    <ul>
                        <li>
                            <Link to="/" className="l-admin-layout__back-link">
                                ⬅ {t("Voltar ao App")}
                            </Link>
                        </li>
                        <div className="l-admin-layout__divider"></div>
                        <li><Link to="/admin">{t("Dashboard Geral")}</Link></li>
                        <li><Link to="/admin/users">{t("Gerenciar Usuários")}</Link></li>
                        <li><Link to="/admin/support">{t("Helpdesk / Suporte")}</Link></li>
                        <li><Link to="/admin/settings">{t("Configurações Base")}</Link></li>
                        <li><Link to="/admin/logs">{t("Logs do Sistema")}</Link></li>
                    </ul>
                </nav>
            </aside>
            <main className="l-admin-layout__content">
                <Outlet />
            </main>
        </div>
    );
}
