import { useEffect, useState } from 'react';
import { fetchAuditLogs } from '../../../api';
import { useLanguage } from '../../../contexts/LanguageContext';
import styles from './AdminLogsPage.module.css';

export default function AdminLogsPage() {
    const { t } = useLanguage();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [limitFilter, setLimitFilter] = useState('100');

    // List of typical log actions for dropdown filter
    const logActionsList = [
        { value: '', label: t('Todas as Ações') },
        { value: 'LOGIN', label: 'LOGIN' },
        { value: 'REGISTER', label: 'REGISTER' },
        { value: 'CHANGE_PASSWORD', label: 'CHANGE_PASSWORD' },
        { value: 'UPDATE_PROFILE', label: 'UPDATE_PROFILE' },
        { value: 'CREATE_PROJECT', label: 'CREATE_PROJECT' },
        { value: 'UPDATE_PROJECT', label: 'UPDATE_PROJECT' },
        { value: 'DELETE_PROJECT', label: 'DELETE_PROJECT' },
        { value: 'CREATE_TASK', label: 'CREATE_TASK' },
        { value: 'UPDATE_TASK', label: 'UPDATE_TASK' },
        { value: 'DELETE_TASK', label: 'DELETE_TASK' },
        { value: 'CREATE_TIME_ENTRY', label: 'CREATE_TIME_ENTRY' },
        { value: 'UPDATE_TIME_ENTRY', label: 'UPDATE_TIME_ENTRY' },
        { value: 'DELETE_TIME_ENTRY', label: 'DELETE_TIME_ENTRY' }
    ];

    useEffect(() => {
        loadLogs();
    }, [actionFilter, limitFilter]); // Reload automatically on drop-down changes

    async function loadLogs() {
        try {
            setLoading(true);
            const data = await fetchAuditLogs({
                action: actionFilter,
                username: userFilter,
                limit: parseInt(limitFilter, 10)
            });
            setLogs(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    function handleSearchSubmit(e) {
        e.preventDefault();
        loadLogs();
    }

    function formatLogDate(dateStr) {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleString();
        } catch (e) {
            return dateStr;
        }
    }

    function getActionBadgeClass(action) {
        if (action.startsWith('CREATE')) return styles.badgeSuccess;
        if (action.startsWith('DELETE')) return styles.badgeDanger;
        if (action.startsWith('UPDATE')) return styles.badgeWarning;
        if (action.includes('LOGIN')) return styles.badgeInfo;
        return styles.badgeDefault;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>{t("Logs do Sistema")}</h1>
                <p>{t("Monitore as ações dos usuários e alterações administrativas em tempo real.")}</p>
            </div>

            <form onSubmit={handleSearchSubmit} className={styles.filterForm}>
                <div className={styles.formGroup}>
                    <label>{t("Ação")}</label>
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className={styles.select}
                    >
                        {logActionsList.map(a => (
                            <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>{t("Usuário")}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            placeholder={t("Nome de usuário")}
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            className={styles.input}
                        />
                        <button type="submit" className={styles.btnSearch}>{t("Buscar")}</button>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label>{t("Exibir")}</label>
                    <select
                        value={limitFilter}
                        onChange={(e) => setLimitFilter(e.target.value)}
                        className={styles.select}
                        style={{ minWidth: '80px' }}
                    >
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                    </select>
                </div>
            </form>

            <div className={styles.tableWrapper}>
                {loading ? (
                    <div className={styles.spinnerWrapper}>
                        <div className={styles.spinner}></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className={styles.noLogs}>
                        {t("Sem logs correspondentes aos filtros.")}
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>{t("Data e Hora")}</th>
                                <th>{t("Usuário")}</th>
                                <th>{t("Ação")}</th>
                                <th>{t("IP")}</th>
                                <th>{t("Descrição")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td className={styles.timestampCell}>{formatLogDate(log.created_at)}</td>
                                    <td>
                                        <span className={styles.username}>
                                            {log.username || 'System/Guest'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles['o-badge']} ${getActionBadgeClass(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className={styles.ipCell}>{log.ip_address || '—'}</td>
                                    <td className={styles.descCell}>{log.description || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
