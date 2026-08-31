import { useState, useEffect } from 'react';
import { fetchAllTicketsAdmin, fetchTicketMessages, replyTicket, updateTicketStatusAdmin, deleteTicketAdmin } from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatBrasiliaDateTime, formatBrasiliaTime } from '../../../utils/dateUtils';
import styles from '../SupportPage/SupportPage.module.css';

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
            alert('Erro ao carregar chamados pelo Admin: ' + e.message);
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
        if (!window.confirm(`Tem certeza que deseja mudar o status para ${newStatus}?`)) return;
        try {
            await updateTicketStatusAdmin(selectedTicket.id, newStatus);
            setSelectedTicket(prev => ({ ...prev, status: newStatus }));
            if (newStatus === 'resolved') {
                alert('Chamado marcado como resolvido e bloqueado para novas respostas.');
            }
        } catch (e) {
            alert('Erro: ' + e.message);
        }
    }

    async function handleDeleteTicket() {
        if (!window.confirm(`Tem certeza absoluta que deseja excluir o chamado #${selectedTicket.id}? Isso apagará todo o histórico de mensagens PERMANENTEMENTE.`)) return;
        try {
            await deleteTicketAdmin(selectedTicket.id);
            setSelectedTicket(null);
            loadTickets();
        } catch (e) {
            alert('Erro ao excluir chamado: ' + e.message);
        }
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>{t("Gestão de Helpdesk (Admin)")}</h1>
                <p>{t("Responda aos usuários e gerencie o pipeline de suporte.")}</p>
            </header>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'open' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('open')}
                >
                    {t("Novos Chamados")} {tickets.length > 0 && activeTab === 'open' && `(${tickets.length})`}
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'answered' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('answered')}
                >{t("Em Andamento")}</button>
                <button
                    className={`${styles.tab} ${activeTab === 'resolved' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('resolved')}
                >{t("Resolvidos")}</button>
            </div>

            <main className={styles.content}>
                {!selectedTicket && (
                    <div className={styles.ticketList}>
                        {loading ? <p>{t("Carregando...")}</p> : (
                            tickets.length === 0 ? <p className={styles.empty}>{t("Nenhuma fila encontrada para este filtro.")}</p> :
                                tickets.map(ticket => (
                                    <div key={ticket.id} className={styles.ticketCard} onClick={() => openChat(ticket)}>
                                        <div className={styles.ticketHeader}>
                                            <h3>#{ticket.id} - {ticket.subject}</h3>
                                            <span className={`${styles['o-badge']} ${styles[ticket.status]}`}>
                                                {ticket.status === 'open' ? t('Novo / Aguardando Admin') : ticket.status === 'answered' ? t('Respondido') : t('Resolvido')}
                                            </span>
                                        </div>
                                        <small className={styles.ticketDate}>{t("Autor:")} {ticket.user_name} | {t("Atualizado em:")} {formatBrasiliaDateTime(ticket.updated_at, language)}</small>
                                    </div>
                                ))
                        )}
                    </div>
                )}

                {selectedTicket && (
                    <div className={styles.chatWindow}>
                        <div className={styles.chatHeader}>
                            <button className={styles.btnBack} onClick={() => setSelectedTicket(null)}>{t("⬅ Voltar")}</button>
                            <h2>{selectedTicket.subject} ({t("Autor:")} {selectedTicket.user_name})</h2>

                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                                {selectedTicket.status !== 'resolved' ? (
                                    <button
                                        onClick={() => changeStatus('resolved')}
                                        className={styles.btnPrimary}
                                        style={{ background: '#22c55e' }}
                                    >{t("✓ Marcar Resolvido")}</button>
                                ) : (
                                    <button
                                        onClick={() => changeStatus('open')}
                                        className={styles.btnPrimary}
                                        style={{ background: '#f59f00' }}
                                    >{t("↺ Reabrir Chamado")}</button>
                                )}
                                <button
                                    onClick={handleDeleteTicket}
                                    className={styles.btnPrimary}
                                    style={{ background: '#ef4444' }}
                                >{t("🗑️ Excluir")}</button>
                            </div>
                        </div>

                        <div className={styles.chatMessages}>
                            {chatLoading ? <p>{t("Monitorando histórico...")}</p> : (
                                chatMessages.map(msg => {
                                    const isMe = msg.sender_id === user.id;
                                    const isAdmin = msg.is_admin;
                                    return (
                                        <div key={msg.id} className={`${styles.messageWrap} ${isAdmin ? styles.alignRight : styles.alignLeft}`}>
                                            <div className={`${styles.messageBubble} ${isAdmin ? styles.bubbleMe : styles.bubbleThem}`}>
                                                <div className={styles.msgMeta}>
                                                    <strong>{isAdmin ? (isMe ? t('Você (Admin)') : msg.sender_name) : msg.sender_name}</strong>
                                                    <small>{formatBrasiliaTime(msg.created_at, language)}</small>
                                                </div>
                                                <div className={styles.msgText}>{msg.message}</div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {selectedTicket.status === 'resolved' ? (
                            <div className={styles.chatClosedNotice}>
                                {t("🔒 Este chamado está resolvido. Os usuários não podem responder até que você reabra.")}
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className={styles.chatForm}>
                                <textarea
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    placeholder="Escreva sua resposta de Suporte. Ao enviar, este chamado irá para 'Em Andamento'..."
                                    rows={3}
                                    disabled={chatLoading}
                                />
                                <button type="submit" disabled={chatLoading} className={styles.btnPrimary}>{t("Enviar Resposta")}</button>
                            </form>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
