import { useEffect, useState } from 'react';
import { fetchAllUsers, toggleAdminRole, deleteAdminUser, updateUserProfile } from '../../../api';
import { useLanguage } from '../../../contexts/LanguageContext';
import AdminEditUserModal from './AdminEditUserModal';
import AdminCreateUserModal from '../../organisms/AdminCreateUserModal/AdminCreateUserModal';
import styles from './UsersManagementPage.module.css';

export default function UsersManagementPage() {
    const { t } = useLanguage();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [isCreatingUser, setIsCreatingUser] = useState(false);

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
        const msg = currentStatus
            ? t('Deseja remover acesso de administrador para este usuário?')
            : t('Deseja conceder acesso de administrador para este usuário?');
        if (!window.confirm(msg)) return;
        try {
            await toggleAdminRole(userId, !currentStatus);
            loadUsers();
        } catch (e) {
            alert(e.message);
        }
    }

    async function handleDelete(userId) {
        if (!window.confirm(t('Excluir este usuário APAGARÁ TODOS OS DADOS dele permanentemente. Tem certeza absoluta?'))) return;
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

    if (loading) return <p className={styles.loading}>{t("Carregando usuários...")}</p>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>{t("Gerenciamento de Usuários")}</h1>
                <button
                    className={styles.btnCreate}
                    onClick={() => setIsCreatingUser(true)}
                >
                    {t("+ Criar Novo Usuário")}
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>{t("Usuário")}</th>
                            <th>{t("Nome Completo")}</th>
                            <th>Email</th>
                            <th>{t("País")}</th>
                            <th>{t("Telefone")}</th>
                            <th>{t("Status")}</th>
                            <th>{t("Papel")}</th>
                            <th>{t("Ações")}</th>
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
                                        {u.is_active ? t('Ativo') : t('Pendente')}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${styles.badge} ${u.is_admin ? styles.admin : styles.member}`}>
                                        {u.is_admin ? 'Admin' : t('Membro')}
                                    </span>
                                </td>
                                <td className={styles.actions}>
                                    <button className={styles.btn} onClick={() => setEditingUser(u)}>
                                        {t('Editar')}
                                    </button>
                                    <button className={styles.btn} onClick={() => handleToggleAdmin(u.id, u.is_admin)}>
                                        {u.is_admin ? t('Remover Admin') : t('Dar Admin')}
                                    </button>
                                    <button className={`${styles.btn} ${styles.btnDelete}`} onClick={() => handleDelete(u.id)}>
                                        {t('Excluir')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>{t("Nenhum usuário encontrado")}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {editingUser && (
                <AdminEditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleSaveUser}
                />
            )}

            {isCreatingUser && (
                <AdminCreateUserModal
                    onClose={() => setIsCreatingUser(false)}
                    onSuccess={() => {
                        setIsCreatingUser(false);
                        loadUsers();
                    }}
                />
            )}
        </div>
    );
}
