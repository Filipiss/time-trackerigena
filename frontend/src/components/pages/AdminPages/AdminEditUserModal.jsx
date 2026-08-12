import { useState, useEffect } from 'react';
import styles from './AdminEditUserModal.module.css';

export default function AdminEditUserModal({ user, onClose, onSave }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        full_name: '',
        country: '',
        phone: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                full_name: user.full_name || '',
                country: user.country || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    function handleSubmit(e) {
        e.preventDefault();
        onSave(formData);
    }

    if (!user) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Editar Perfil de {user.username}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.formBody}>
                    <div className={styles.formGroup}>
                        <label>Username</label>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} required />
                    </div>

                    <div className={styles.formGroup}>
                        <label>E-mail</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Nome Completo</label>
                        <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} />
                    </div>

                    <div className={styles.formGroup}>
                        <label>País</label>
                        <input type="text" name="country" value={formData.country} onChange={handleChange} />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Telefone</label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                    </div>

                    <div className={styles.alert}>
                        ⚠️ Para a segurança do usuário, senhas não podem ser editadas pelo administrador.
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.btnCancel} onClick={onClose}>Cancelar</button>
                        <button type="submit" className={styles.btnSave}>Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
