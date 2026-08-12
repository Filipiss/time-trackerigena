import { useEffect, useState } from 'react';
import { fetchAdminMetrics } from '../../../api';
import styles from './AdminDashboardPage.module.css';

export default function AdminDashboardPage() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMetrics();
    }, []);

    async function loadMetrics() {
        try {
            const data = await fetchAdminMetrics();
            setMetrics(data);
        } catch (e) {
            console.error(e);
            alert("Erro ao carregar métricas do painel.");
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className={styles.loading}>Carregando painel geral...</div>;
    if (!metrics) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Dashboard de Sistema</h1>
                <p>Estatísticas holísticas de engajamento do Trackerígena.</p>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardIcon}>👥</div>
                    <div className={styles.cardInfo}>
                        <h3>Usuários</h3>
                        <p>{metrics.users}</p>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardIcon}>📁</div>
                    <div className={styles.cardInfo}>
                        <h3>Projetos ativos</h3>
                        <p>{metrics.projects}</p>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardIcon}>✅</div>
                    <div className={styles.cardInfo}>
                        <h3>Tarefas cadastradas</h3>
                        <p>{metrics.tasks}</p>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardIcon}>⏱️</div>
                    <div className={styles.cardInfo}>
                        <h3>Horas totais</h3>
                        <p>{metrics.total_hours}</p>
                    </div>
                </div>
            </div>

            <div className={styles.recentActivity}>
                <h2>Resumo</h2>
                <p>O aplicativo possui um volume constante de novos blocos faturados.
                    Utilize o Google Analytics para visualizar o tráfego detalhado em tempo real.</p>
            </div>
        </div>
    );
}
