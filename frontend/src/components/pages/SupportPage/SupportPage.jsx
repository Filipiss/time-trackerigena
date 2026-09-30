import { useState, useEffect } from 'react';
import { fetchMyTickets, createTicket, fetchTicketMessages, replyTicket } from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatBrasiliaDateTime, formatBrasiliaTime } from '../../../utils/dateUtils';
import './SupportPage.css';

export default function SupportPage() {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState('new');
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);

    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const [selectedTicket, setSelectedTicket] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'open' || activeTab === 'resolved') {
            loadTickets();
        }
        setSelectedTicket(null);
    }, [activeTab]);

    async function loadTickets() {
        setLoading(true);
        try {
            const data = await fetchMyTickets();
            const openStates = ['open', 'answered'];
            if (activeTab === 'open') {
                setTickets(data.filter(t => openStates.includes(t.status)));
            } else {
                setTickets(data.filter(t => t.status === 'resolved'));
            }
        } catch (e) {
            alert(t('Erro ao carregar chamados:') + ' ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateTicket(e) {
        e.preventDefault();
        try {
            await createTicket(subject, message);
            setSubject('');
            setMessage('');
            alert(t('Chamado aberto com sucesso!'));
            setActiveTab('open');
        } catch (e) {
            alert('Erro: ' + e.message);
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

    return (
        <div className="c-support">
            <header className="c-support__header">
                <h1>{t("Suporte Técnico e Ajuda")}</h1>
                <p>{t("Relate problemas ou tire dúvidas com os administradores.")}</p>
            </header>

            <div className="c-support__tabs">
                <button
                    className={`c-support__tab ${activeTab === 'new' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('new')}
                >{t("Criar Chamado")}</button>
                <button
                    className={`c-support__tab ${activeTab === 'open' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('open')}
                >{t("Meus Chamados Ativos")}</button>
                <button
                    className={`c-support__tab ${activeTab === 'resolved' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('resolved')}
                >{t("Resolvidos")}</button>
            </div>

            <main className="c-support__content">
                {activeTab === 'new' && (
                    <form onSubmit={handleCreateTicket}>
                        <div className="c-support__form-group">
                            <label>{t("Assunto (Resumo do problema)")}</label>
                            <input
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder={t("Do que você precisa de ajuda?")}
                                required
                                maxLength={150}
                            />
                        </div>
                        <div className="c-support__form-group">
                            <label>{t("Mensagem Detalhada")}</label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder={t("Descreva tudo em detalhes para podermos ajudar...")}
                                required
                                rows={6}
                            />
                        </div>
                        <button type="submit" className="c-support__btn--primary">{t("Enviar Novo Chamado")}</button>
                    </form>
                )}

                {(activeTab === 'open' || activeTab === 'resolved') && !selectedTicket && (
                    <div className="c-support__ticket-list">
                        {loading ? <p>{t("Carregando...")}</p> : (
                            tickets.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>{t("Nenhum chamado listado aqui.")}</p> :
                                tickets.map(ticketItem => (
                                    <div key={ticketItem.id} className="c-support__ticket-card" onClick={() => openChat(ticketItem)}>
                                        <div className="c-support__ticket-header">
                                            <h3>{ticketItem.subject}</h3>
                                            <span className={`o-badge o-badge--${ticketItem.status}`}>
                                                {ticketItem.status === 'open' ? t('Aguardando Atendimento') : ticketItem.status === 'answered' ? t('Respondido') : t('Resolvido')}
                                            </span>
                                        </div>
                                        <small className="c-support__ticket-date">{t("Atualizado em:")} {formatBrasiliaDateTime(ticketItem.updated_at, language)}</small>
                                    </div>
                                ))
                        )}
                    </div>
                )}

                {selectedTicket && (
                    <div className="c-support__chat-window">
                        <div className="c-support__chat-header">
                            <button className="c-support__btn--back" onClick={() => setSelectedTicket(null)}>{t("⬅ Voltar para lista")}</button>
                            <h2>{selectedTicket.subject}</h2>
                            <span className={`o-badge o-badge--${selectedTicket.status}`}>
                                {selectedTicket.status === 'open' ? t('Aguardando Atendimento') : selectedTicket.status === 'answered' ? t('Respondido') : t('Resolvido')}
                            </span>
                        </div>

                        <div className="c-support__chat-messages">
                            {chatLoading ? <p>{t("Montando histórico...")}</p> : (
                                chatMessages.map(msg => {
                                    const isMe = msg.sender_id === user.id;
                                    return (
                                        <div key={msg.id} className={`c-support__message-wrap ${isMe ? 'c-support__message-wrap--right' : 'c-support__message-wrap--left'}`}>
                                            <div className={`c-support__message-bubble ${isMe ? 'c-support__message-bubble--me' : 'c-support__message-bubble--them'}`}>
                                                <div className="c-support__msg-meta">
                                                    <strong>{isMe ? t('Você') : (msg.is_admin ? t('🛡️ Suporte') : msg.sender_name)}</strong>
                                                    <small>{formatBrasiliaTime(msg.created_at, language)}</small>
                                                </div>
                                                <div className="c-support__msg-text">{msg.message}</div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {selectedTicket.status === 'resolved' ? (
                            <div className="c-support__chat-closed">
                                {t("🔒 Este chamado foi encerrado pelo suporte. Não é possível enviar novas mensagens.")}
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className="c-support__chat-form">
                                <textarea
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    placeholder={t("Escreva sua resposta...")}
                                    rows={3}
                                    disabled={chatLoading}
                                />
                                <button type="submit" disabled={chatLoading} className="c-support__btn--primary">{t("Enviar")}</button>
                            </form>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
