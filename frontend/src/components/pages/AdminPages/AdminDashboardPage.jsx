import { useEffect, useState } from 'react';
import { fetchAdminMetrics } from '../../../api';
import { useLanguage } from '../../../contexts/LanguageContext';
import styles from './AdminDashboardPage.module.css';

export default function AdminDashboardPage() {
    const { t } = useLanguage();
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
            alert(t("Erro ao carregar métricas do painel."));
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className={styles.loading}>{t("Carregando painel geral...")}</div>;
    if (!metrics) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>{t("Dashboard de Sistema")}</h1>
                <p>{t("Estatísticas holísticas de engajamento do Trackerígena.")}</p>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardIcon}>👥</div>
                    <div className={styles.cardInfo}>
                        <h3>{t("Usuários")}</h3>
                        <p>{metrics.users}</p>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardIcon}>📁</div>
                    <div className={styles.cardInfo}>
                        <h3>{t("Projetos ativos")}</h3>
                        <p>{metrics.projects}</p>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardIcon}>✅</div>
                    <div className={styles.cardInfo}>
                        <h3>{t("Tarefas cadastradas")}</h3>
                        <p>{metrics.tasks}</p>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardIcon}>⏱️</div>
                    <div className={styles.cardInfo}>
                        <h3>{t("Horas totais")}</h3>
                        <p>{metrics.total_hours}</p>
                    </div>
                </div>
            </div>

            <div className={styles.recentActivity}>
                <h2>{t("Resumo")}</h2>
                <p>{t("O aplicativo possui um volume constante de novos blocos faturados. Utilize o Google Analytics para visualizar o tráfego detalhado em tempo real:")}</p>
                <div style={{ marginTop: '8px' }}>
                    <a
                        href="https://analytics.google.com/analytics/web/#/a404478018p549687196/reports/intelligenthome?params=_u..nav%3Dmaui"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.analyticsLink}
                    >
                        https://analytics.google.com/analytics/web/#/a404478018p549687196/reports/intelligenthome?params=_u..nav%3Dmaui
                    </a>
                </div>
            </div>
        </div>
    );
}
