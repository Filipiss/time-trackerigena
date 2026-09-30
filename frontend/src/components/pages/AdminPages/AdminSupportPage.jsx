import { useState, useEffect } from 'react';
import { fetchAllTicketsAdmin, fetchTicketMessages, replyTicket, updateTicketStatusAdmin, deleteTicketAdmin } from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatBrasiliaDateTime, formatBrasiliaTime } from '../../../utils/dateUtils';
import '../SupportPage/SupportPage.css';

export default function AdminSupportPage() {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState('open');
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectedTicket, setSelectedTicket] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    useEffect(() => {
        loadTickets();
        setSelectedTicket(null);
    }, [activeTab]);

    async function loadTickets() {
        setLoading(true);
        try {
            const data = await fetchAllTicketsAdmin();
            setTickets(data.filter(t => t.status === activeTab));
        } catch (e) {
            alert('Erro: ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    async function openChat(ticket) {
        setSelectedTicket(ticket);
        await loadChat(ticket.id);
    }

    async function loadChat(ticketId) {
        setChatLoading(true);
        try {
            const data = await fetchTicketMessages(ticketId);
            setChatMessages(data.messages);
            setSelectedTicket(prev => ({ ...prev, status: data.ticket.status }));
        } catch (e) {
            alert('Erro: ' + e.message);
        } finally {
            setChatLoading(false);
        }
    }

    async function handleSendMessage(e) {
        e.preventDefault();
        if (!chatInput.trim()) return;

        try {
            await replyTicket(selectedTicket.id, chatInput);
            setChatInput('');
            await loadChat(selectedTicket.id);
        } catch (e) {
            alert('Erro: ' + e.message);
        }
    }

    async function changeStatus(newStatus) {
        try {
            await updateTicketStatusAdmin(selectedTicket.id, newStatus);
            setSelectedTicket(prev => ({ ...prev, status: newStatus }));
            loadTickets();
        } catch (e) {
            alert('Erro: ' + e.message);
        }
    }

    async function handleDeleteTicket() {
        if (!window.confirm(t("Tem certeza de que deseja excluir este chamado permanentemente?"))) return;
        try {
            await deleteTicketAdmin(selectedTicket.id);
            setSelectedTicket(null);
            loadTickets();
        } catch (e) {
            alert('Erro: ' + e.message);
        }
    }

    return (
        <div className="c-support">
            <header className="c-support__header">
                <h1>{t("Gestão de Helpdesk (Admin)")}</h1>
                <p>{t("Responda aos usuários e gerencie o pipeline de suporte.")}</p>
            </header>

            <div className="c-support__tabs">
                <button
                    className={`c-support__tab ${activeTab === 'open' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('open')}
                >
                    {t("Novos Chamados")} {tickets.length > 0 && activeTab === 'open' && `(${tickets.length})`}
                </button>
                <button
                    className={`c-support__tab ${activeTab === 'answered' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('answered')}
                >{t("Em Andamento")}</button>
                <button
                    className={`c-support__tab ${activeTab === 'resolved' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('resolved')}
                >{t("Resolvidos")}</button>
            </div>

            <main className="c-support__content">
                {!selectedTicket && (
                    <div className="c-support__ticket-list">
                        {loading ? <p>{t("Carregando...")}</p> : (
                            tickets.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>{t("Nenhuma fila encontrada para este filtro.")}</p> :
                                tickets.map(ticket => (
                                    <div key={ticket.id} className="c-support__ticket-card" onClick={() => openChat(ticket)}>
                                        <div className="c-support__ticket-header">
                                            <h3>#{ticket.id} - {ticket.subject}</h3>
                                            <span className={`o-badge o-badge--${ticket.status}`}>
                                                {ticket.status === 'open' ? t('Novo / Aguardando Admin') : ticket.status === 'answered' ? t('Respondido') : t('Resolvido')}
                                            </span>
                                        </div>
                                        <small className="c-support__ticket-date">{t("Autor:")} {ticket.user_name} | {t("Atualizado em:")} {formatBrasiliaDateTime(ticket.updated_at, language)}</small>
                                    </div>
                                ))
                        )}
                    </div>
                )}

                {selectedTicket && (
                    <div className="c-support__chat-window">
                        <div className="c-support__chat-header">
                            <button className="c-support__btn--back" onClick={() => setSelectedTicket(null)}>{t("⬅ Voltar")}</button>
                            <h2>{selectedTicket.subject} ({t("Autor:")} {selectedTicket.user_name})</h2>

                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                                {selectedTicket.status !== 'resolved' ? (
                                    <button
                                        onClick={() => changeStatus('resolved')}
                                        className="c-support__btn--primary"
                                        style={{ background: '#22c55e' }}
                                    >{t("✓ Marcar Resolvido")}</button>
                                ) : (
                                    <button
                                        onClick={() => changeStatus('open')}
                                        className="c-support__btn--primary"
                                        style={{ background: '#f59f00' }}
                                    >{t("↺ Reabrir Chamado")}</button>
                                )}
                                <button
                                    onClick={handleDeleteTicket}
                                    className="c-support__btn--primary"
                                    style={{ background: '#ef4444' }}
                                ><TrashIcon /> {t("Excluir")}</button>
                            </div>
                        </div>

                        <div className="c-support__chat-messages">
                            {chatLoading ? <p>{t("Monitorando histórico...")}</p> : (
                                chatMessages.map(msg => {
                                    const isMe = msg.sender_id === user.id;
                                    const isAdmin = msg.is_admin;
                                    return (
                                        <div key={msg.id} className={`c-support__message-wrap ${isAdmin ? 'c-support__message-wrap--right' : 'c-support__message-wrap--left'}`}>
                                            <div className={`c-support__message-bubble ${isAdmin ? 'c-support__message-bubble--me' : 'c-support__message-bubble--them'}`}>
                                                <div className="c-support__msg-meta">
                                                    <strong>{isAdmin ? (isMe ? t('Você (Admin)') : msg.sender_name) : msg.sender_name}</strong>
                                                    <small>{formatBrasiliaTime(msg.created_at, language)}</small>
                                                </div>
                                                <div className="c-support__msg-text">{msg.message}</div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <form onSubmit={handleSendMessage} className="c-support__chat-form">
                            <textarea
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder={t("Escreva sua resposta como Administrador...")}
                                rows={3}
                                disabled={chatLoading}
                            />
                            <button type="submit" disabled={chatLoading} className="c-support__btn--primary">{t("Enviar Resposta")}</button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}

function TrashIcon() {
    return <span>🗑️</span>;
}
