import { useState, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import './AdminEditUserModal.css';

export default function AdminEditUserModal({ user, onClose, onSave }) {
    const { t } = useLanguage();
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
        <div className="c-admin-edit-modal__overlay">
            <div className="c-admin-edit-modal">
                <div className="c-admin-edit-modal__header">
                    <h2>{t("Editar Perfil de")} {user.username}</h2>
                    <button className="c-admin-edit-modal__close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="c-admin-edit-modal__form">
                    <div className="c-admin-edit-modal__form-group">
                        <label>Username</label>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} required />
                    </div>

                    <div className="c-admin-edit-modal__form-group">
                        <label>E-mail</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>

                    <div className="c-admin-edit-modal__form-group">
                        <label>{t("Nome Completo")}</label>
                        <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} />
                    </div>

                    <div className="c-admin-edit-modal__form-group">
                        <label>{t("País")}</label>
                        <input type="text" name="country" value={formData.country} onChange={handleChange} />
                    </div>

                    <div className="c-admin-edit-modal__form-group">
                        <label>{t("Telefone")}</label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                    </div>

                    <div className="c-admin-edit-modal__alert">
                        {t("⚠️ Para a segurança do usuário, senhas não podem ser editadas pelo administrador.")}
                    </div>

                    <div className="c-admin-edit-modal__actions">
                        <button type="button" className="c-admin-edit-modal__btn--cancel" onClick={onClose}>{t("Cancelar")}</button>
                        <button type="submit" className="c-admin-edit-modal__btn--save">{t("Salvar Alterações")}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
