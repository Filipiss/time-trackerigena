import { useState, useEffect } from 'react';
import { fetchMyTickets, createTicket, fetchTicketMessages, replyTicket } from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './SupportPage.module.css';

export default function SupportPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('new'); // new, open, resolved
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);

    // Create Mode
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    // Chat Mode
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
            const openStates = ['open', 'answered']; // Em aberto ou respondido
            if (activeTab === 'open') {
                setTickets(data.filter(t => openStates.includes(t.status)));
            } else {
                setTickets(data.filter(t => t.status === 'resolved'));
            }
        } catch (e) {
            alert('Erro ao carregar chamados: ' + e.message);
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
            alert('Chamado aberto com sucesso!');
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
            // Verify if status changed
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
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Suporte Técnico e Ajuda</h1>
                <p>Relate problemas ou tire dúvidas com os administradores.</p>
            </header>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'new' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('new')}
                >Criar Chamado</button>
                <button
                    className={`${styles.tab} ${activeTab === 'open' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('open')}
                >Meus Chamados Ativos</button>
                <button
                    className={`${styles.tab} ${activeTab === 'resolved' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('resolved')}
                >Resolvidos</button>
            </div>

            <main className={styles.content}>
                {/* CRIAR CHAMADO */}
                {activeTab === 'new' && (
                    <form onSubmit={handleCreateTicket} className={styles.createForm}>
                        <div className={styles.formGroup}>
                            <label>Assunto (Resumo do problema)</label>
                            <input
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="Do que você precisa de ajuda?"
                                required
                                maxLength={150}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Mensagem Detalhada</label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Descreva tudo em detalhes para podermos ajudar..."
                                required
                                rows={6}
                            />
                        </div>
                        <button type="submit" className={styles.btnPrimary}>Enviar Novo Chamado</button>
                    </form>
                )}

                {/* LISTAGEM (ATIVOS OU RESOLVIDOS) */}
                {(activeTab === 'open' || activeTab === 'resolved') && !selectedTicket && (
                    <div className={styles.ticketList}>
                        {loading ? <p>Carregando...</p> : (
                            tickets.length === 0 ? <p className={styles.empty}>Nenhum chamado listado aqui.</p> :
                                tickets.map(t => (
                                    <div key={t.id} className={styles.ticketCard} onClick={() => openChat(t)}>
                                        <div className={styles.ticketHeader}>
                                            <h3>{t.subject}</h3>
                                            <span className={`${styles['o-badge']} ${styles[t.status]}`}>
                                                {t.status === 'open' ? 'Aguardando Atendimento' : t.status === 'answered' ? 'Respondido' : 'Resolvido'}
                                            </span>
                                        </div>
                                        <small className={styles.ticketDate}>Atualizado em: {new Date(t.updated_at).toLocaleString()}</small>
                                    </div>
                                ))
                        )}
                    </div>
                )}

                {/* MODAL/JANELA DE CHAT */}
                {selectedTicket && (
                    <div className={styles.chatWindow}>
                        <div className={styles.chatHeader}>
                            <button className={styles.btnBack} onClick={() => setSelectedTicket(null)}>⬅ Voltar para lista</button>
                            <h2>{selectedTicket.subject}</h2>
                            <span className={`${styles['o-badge']} ${styles[selectedTicket.status]}`}>
                                {selectedTicket.status === 'open' ? 'Aguardando Atendimento' : selectedTicket.status === 'answered' ? 'Respondido' : 'Resolvido'}
                            </span>
                        </div>

                        <div className={styles.chatMessages}>
                            {chatLoading ? <p>Montando histórico...</p> : (
                                chatMessages.map(msg => {
                                    const isMe = msg.sender_id === user.id;
                                    return (
                                        <div key={msg.id} className={`${styles.messageWrap} ${isMe ? styles.alignRight : styles.alignLeft}`}>
                                            <div className={`${styles.messageBubble} ${isMe ? styles.bubbleMe : styles.bubbleThem}`}>
                                                <div className={styles.msgMeta}>
                                                    <strong>{isMe ? 'Você' : (msg.is_admin ? '🛡️ Suporte' : msg.sender_name)}</strong>
                                                    <small>{new Date(msg.created_at).toLocaleTimeString()}</small>
                                                </div>
                                                <div className={styles.msgText}>{msg.message}</div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {selectedTicket.status === 'resolved' ? (
                            <div className={styles.chatClosedNotice}>
                                🔒 Este chamado foi encerrado pelo suporte. Não é possível enviar novas mensagens.
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className={styles.chatForm}>
                                <textarea
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    placeholder="Escreva sua resposta..."
                                    rows={3}
                                    disabled={chatLoading}
                                />
                                <button type="submit" disabled={chatLoading} className={styles.btnPrimary}>Enviar</button>
                            </form>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
