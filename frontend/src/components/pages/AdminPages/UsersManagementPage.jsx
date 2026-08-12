import { useEffect, useState } from 'react';
import { fetchAllUsers, toggleAdminRole, deleteAdminUser, updateUserProfile } from '../../../api';
import AdminEditUserModal from './AdminEditUserModal';
import styles from './UsersManagementPage.module.css';

export default function UsersManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        try {
            const data = await fetchAllUsers();
            setUsers(data);
        } catch (err) {
            console.error(err);
            alert('Erro ao carregar usuários: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleAdmin(userId, currentStatus) {
        if (!window.confirm(`Deseja ${currentStatus ? 'remover' : 'conceder'} acesso de administrador para este usuário?`)) return;
        try {
            await toggleAdminRole(userId, !currentStatus);
            loadUsers();
        } catch (e) {
            alert(e.message);
        }
    }

    async function handleDelete(userId) {
        if (!window.confirm('Excluir este usuário APAGARÁ TODOS OS DADOS dele permanentemente. Tem certeza absoluta?')) return;
        try {
            await deleteAdminUser(userId);
            loadUsers();
        } catch (e) {
            alert(e.message);
        }
    }

    async function handleSaveUser(formData) {
        try {
            await updateUserProfile(editingUser.id, formData);
            setEditingUser(null);
            loadUsers();
        } catch (e) {
            alert(e.message);
        }
    }

    if (loading) return <p className={styles.loading}>Carregando usuários...</p>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Gerenciamento de Usuários</h1>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Usuário</th>
                        <th>Nome Completo</th>
                        <th>Email</th>
                        <th>País</th>
                        <th>Telefone</th>
                        <th>Status</th>
                        <th>Papel</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td>{u.id}</td>
                            <td>{u.username}</td>
                            <td>{u.full_name || <span style={{ color: '#a0aab2' }}>---</span>}</td>
                            <td>{u.email}</td>
                            <td>{u.country || <span style={{ color: '#a0aab2' }}>---</span>}</td>
                            <td>{u.phone || <span style={{ color: '#a0aab2' }}>---</span>}</td>
                            <td>
                                <span className={`${styles.badge} ${u.is_active ? styles.active : styles.inactive}`}>
                                    {u.is_active ? 'Ativo' : 'Pendente'}
                                </span>
                            </td>
                            <td>
                                <span className={`${styles.badge} ${u.is_admin ? styles.admin : styles.member}`}>
                                    {u.is_admin ? 'Admin' : 'Membro'}
                                </span>
                            </td>
                            <td className={styles.actions}>
                                <button className={styles.btn} onClick={() => setEditingUser(u)}>
                                    Editar
                                </button>
                                <button className={styles.btn} onClick={() => handleToggleAdmin(u.id, u.is_admin)}>
                                    {u.is_admin ? 'Remover Admin' : 'Dar Admin'}
                                </button>
                                <button className={`${styles.btn} ${styles.btnDelete}`} onClick={() => handleDelete(u.id)}>
                                    Excluir
                                </button>
                            </td>
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr>
                            <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Nenhum usuário encontrado</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {editingUser && (
                <AdminEditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
}
