import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
    const { user, loading } = useAuth();

    if (loading) return <div className={styles.loader}>Acessando interface restrita...</div>;
    if (!user || user.is_admin !== true) return <Navigate to="/" replace />;

    return (
        <div className={styles.adminLayout}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h2>Painel Admin</h2>
                    <span className={styles.adminBadge}>Admin {user.username}</span>
                </div>
                <nav className={styles.navMenu}>
                    <ul>
                        <li>
                            <Link to="/" className={styles.backLink}>
                                ⬅ Voltar ao App
                            </Link>
                        </li>
                        <div className={styles.divider}></div>
                        <li><Link to="/admin">Dashboard Geral</Link></li>
                        <li><Link to="/admin/users">Gerenciar Usuários</Link></li>
                        <li><Link to="/admin/support">Helpdesk / Suporte</Link></li>
                        <li><Link to="/admin/settings">Configurações Base</Link></li>
                    </ul>
                </nav>
                <div className={styles.sidebarFooter}>
                    <Link to="/" className={styles.backBtn}>← Voltar ao App</Link>
                </div>
            </aside>
            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
}
