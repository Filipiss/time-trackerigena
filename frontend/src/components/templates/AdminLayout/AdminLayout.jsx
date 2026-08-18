import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
    const { user, loading } = useAuth();
    const { t } = useLanguage();

    if (loading) return <div className={styles.loader}>Acessando interface restrita...</div>;
    if (!user || user.is_admin !== true) return <Navigate to="/" replace />;

    return (
        <div className={styles.adminLayout}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h2>{t("Painel Admin")}</h2>
                    <span className={styles.adminBadge}>Admin {user.username}</span>
                </div>
                <nav className={styles.navMenu}>
                    <ul>
                        <li>
                            <Link to="/" className={styles.backLink}>
                                ⬅ {t("Voltar ao App")}
                            </Link>
                        </li>
                        <div className={styles.divider}></div>
                        <li><Link to="/admin">{t("Dashboard Geral")}</Link></li>
                        <li><Link to="/admin/users">{t("Gerenciar Usuários")}</Link></li>
                        <li><Link to="/admin/support">{t("Helpdesk / Suporte")}</Link></li>
                        <li><Link to="/admin/settings">{t("Configurações Base")}</Link></li>
                        <li><Link to="/admin/logs">{t("Logs do Sistema")}</Link></li>
                    </ul>
                </nav>
            </aside>
            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
}
