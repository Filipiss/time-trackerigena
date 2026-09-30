import { useEffect, useState } from 'react';
import { fetchAuditLogs, deleteAuditLog, deleteAuditLogsBulk, clearAllAuditLogs } from '../../../api';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatBrasiliaDateTime } from '../../../utils/dateUtils';
import { Trash2 } from 'lucide-react';
import './AdminLogsPage.css';

export default function AdminLogsPage() {
    const { t, language } = useLanguage();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [limitFilter, setLimitFilter] = useState('100');
    const [selectedLogIds, setSelectedLogIds] = useState(new Set());

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
    }, [actionFilter, limitFilter, userFilter]);

    useEffect(() => {
        setSelectedLogIds(new Set());
    }, [logs]);

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

    function highlightText(text, search) {
        if (!search || !text) return text;
        const index = text.toLowerCase().indexOf(search.toLowerCase());
        if (index === -1) return text;

        const before = text.substring(0, index);
        const match = text.substring(index, index + search.length);
        const after = text.substring(index + search.length);

        return (
            <>
                {before}
                <mark className="u-highlight">{match}</mark>
                {after}
            </>
        );
    }

    function handleToggleSelectLog(id) {
        setSelectedLogIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function handleToggleSelectAll() {
        if (selectedLogIds.size === logs.length) {
            setSelectedLogIds(new Set());
        } else {
            setSelectedLogIds(new Set(logs.map(log => log.id)));
        }
    }

    async function handleDeleteSingle(id) {
        if (!window.confirm(t("Tem certeza de que deseja excluir este registro de log?"))) return;
        try {
            await deleteAuditLog(id);
            loadLogs();
        } catch (e) {
            alert(e.message);
        }
    }

    async function handleDeleteBulk() {
        const count = selectedLogIds.size;
        if (!window.confirm(t("Tem certeza de que deseja excluir os {{count}} registros de log selecionados?").replace("{{count}}", count))) return;
        try {
            await deleteAuditLogsBulk(Array.from(selectedLogIds));
            setSelectedLogIds(new Set());
            loadLogs();
        } catch (e) {
            alert(e.message);
        }
    }

    async function handleClearAll() {
        if (window.confirm(t("Tem certeza de que deseja excluir permanentemente todos os logs?"))) {
            if (window.confirm(t("Esta ação NÃO PODE ser desfeita. Deseja mesmo prosseguir e apagar todo o histórico de logs?"))) {
                try {
                    await clearAllAuditLogs();
                    setSelectedLogIds(new Set());
                    loadLogs();
                } catch (e) {
                    alert(e.message);
                }
            }
        }
    }

    function handleSearchSubmit(e) {
        e.preventDefault();
        loadLogs();
    }

    function formatLogDate(dateStr) {
        return formatBrasiliaDateTime(dateStr, language);
    }

    function getActionBadgeClass(action) {
        if (action.startsWith('CREATE')) return 'o-badge--success';
        if (action.startsWith('DELETE')) return 'o-badge--danger';
        if (action.startsWith('UPDATE')) return 'o-badge--warning';
        if (action.includes('LOGIN')) return 'o-badge--info';
        return 'o-badge--default';
    }

    return (
        <div className="c-admin-logs">
            <div className="c-admin-logs__header">
                <h1>{t("Logs do Sistema")}</h1>
                <p>{t("Monitore as ações dos usuários e alterações administrativas em tempo real.")}</p>
            </div>

            <form onSubmit={handleSearchSubmit} className="c-admin-logs__filter-form">
                <div className="c-admin-logs__form-group">
                    <label>{t("Ação")}</label>
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="c-admin-logs__select"
                    >
                        {logActionsList.map(a => (
                            <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                    </select>
                </div>

                <div className="c-admin-logs__form-group">
                    <label>{t("Usuário")}</label>
                    <input
                        type="text"
                        placeholder={t("Nome de usuário")}
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="c-admin-logs__input"
                    />
                </div>

                <div className="c-admin-logs__form-group">
                    <label>{t("Exibir")}</label>
                    <select
                        value={limitFilter}
                        onChange={(e) => setLimitFilter(e.target.value)}
                        className="c-admin-logs__select"
                        style={{ minWidth: '80px' }}
                    >
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                    </select>
                </div>
            </form>

            <div className="c-admin-logs__actions-header">
                {selectedLogIds.size > 0 ? (
                    <div className="c-admin-logs__bulk-actions">
                        <span>{t("{{count}} selecionado(s)").replace("{{count}}", selectedLogIds.size)}</span>
                        <button type="button" onClick={handleDeleteBulk} className="c-admin-logs__btn--bulk-delete">
                            <Trash2 size={13} style={{ marginRight: '6px' }} />
                            {t("Excluir Selecionados")}
                        </button>
                    </div>
                ) : <div />}

                <button type="button" onClick={handleClearAll} className="c-admin-logs__btn--clear-all">
                    <Trash2 size={13} style={{ marginRight: '6px' }} />
                    {t("Limpar Todos os Logs")}
                </button>
            </div>

            <div className="c-admin-logs__table-wrapper">
                {loading ? (
                    <div className="c-admin-logs__spinner-wrapper">
                        <div className="c-admin-logs__spinner"></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="c-admin-logs__empty">
                        {t("Sem logs correspondentes aos filtros.")}
                    </div>
                ) : (
                    <table className="c-admin-logs__table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px', textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={logs.length > 0 && selectedLogIds.size === logs.length}
                                        onChange={handleToggleSelectAll}
                                        className="c-admin-logs__checkbox"
                                    />
                                </th>
                                <th>{t("Data e Hora")}</th>
                                <th>{t("Usuário")}</th>
                                <th>{t("Ação")}</th>
                                <th>{t("IP")}</th>
                                <th>{t("Descrição")}</th>
                                <th style={{ width: '80px', textAlign: 'center' }}>{t("Ações")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className={selectedLogIds.has(log.id) ? 'is-selected' : ''}>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedLogIds.has(log.id)}
                                            onChange={() => handleToggleSelectLog(log.id)}
                                            className="c-admin-logs__checkbox"
                                        />
                                    </td>
                                    <td className="c-admin-logs__timestamp">{formatLogDate(log.created_at)}</td>
                                    <td>
                                        <span className="c-admin-logs__username">
                                            {highlightText(log.username || 'System/Guest', userFilter)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`o-badge ${getActionBadgeClass(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="c-admin-logs__ip">{log.ip_address || '—'}</td>
                                    <td className="c-admin-logs__desc-cell">{log.description || '—'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteSingle(log.id)}
                                            className="c-admin-logs__btn--row-delete"
                                            title={t("Excluir registro")}
                                        >
                                            <Trash2 size={15} strokeWidth={1.5} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
