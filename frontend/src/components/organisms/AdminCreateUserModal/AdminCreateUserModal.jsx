import { useState } from 'react';
import './AdminCreateUserModal.css';
import { createAdminUser } from '../../../api';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function AdminCreateUserModal({ onClose, onSuccess }) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        is_admin: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await createAdminUser(formData);
            alert(t("Usuário criado com sucesso!"));
            onSuccess();
        } catch (err) {
            setError(err.message || t("Falha ao criar o usuário."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="c-admin-user-modal__overlay">
            <div className="c-admin-user-modal">
                <h2 className="c-admin-user-modal__title">{t("Criar Usuário de Teste / Fake")}</h2>
                <p className="c-admin-user-modal__desc">{t("O usuário gerado será ativado instantaneamente e poderá logar no sistema.")}</p>

                {error && <div className="c-admin-user-modal__error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="c-admin-user-modal__form-group">
                        <label>{t("Nome de Usuário (Username)")}</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="c-admin-user-modal__form-group">
                        <label>{t("Email de Teste (Opcional)")}</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={t("Deixe em branco para gerar aleatório")}
                        />
                    </div>
                    <div className="c-admin-user-modal__form-group">
                        <label>{t("Senha Padrão (Opcional)")}</label>
                        <input
                            type="text"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={t("Deixe em branco para usar: 123456")}
                        />
                    </div>

                    <div className="c-admin-user-modal__checkbox-group">
                        <input
                            type="checkbox"
                            name="is_admin"
                            id="checkAdmin"
                            checked={formData.is_admin}
                            onChange={handleChange}
                        />
                        <label htmlFor="checkAdmin">{t("Garantir acesso de Administrador?")}</label>
                    </div>

                    <div className="c-admin-user-modal__actions">
                        <button type="button" onClick={onClose} disabled={loading} className="c-admin-user-modal__btn--secondary">
                            {t("Cancelar")}
                        </button>
                        <button type="submit" disabled={loading} className="c-admin-user-modal__btn--primary">
                            {loading ? t('Criando...') : t('Criar e Ativar Usuário')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
