import { useEffect, useState } from 'react';
import { fetchSettings, updateSettings } from '../../../api';
import { useLanguage } from '../../../contexts/LanguageContext';
import styles from './AdminSettingsPage.module.css';

export default function AdminSettingsPage() {
    const { t } = useLanguage();
    const [settings, setSettings] = useState({ maintenance_mode: false, global_banner: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const data = await fetchSettings();
            if (data) setSettings(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        try {
            await updateSettings(settings);
            alert(t('Configurações salvas e aplicadas em tempo real!'));
        } catch (e) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className={styles.loading}>{t("Carregando configurações...")}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>{t("Configurações Base")}</h1>
                <p>{t("Controle configurações globais, comunicação e bloqueios do sistema.")}</p>
            </div>

            <form onSubmit={handleSave} className={styles.formContainer}>

                <section className={styles.settingsSection}>
                    <h2>{t("Banners de Comunicação")}</h2>
                    <p className={styles.hint}>{t("Digite uma mensagem para exibir no topo de todas as telas (avisos, novidades, etc). Deixe em branco para esconder o banner.")}</p>

                    <textarea
                        className={styles.textarea}
                        rows="3"
                        placeholder="Ex: O sistema entrará em manutenção amanhã às 22h."
                        value={settings.global_banner}
                        onChange={e => setSettings({ ...settings, global_banner: e.target.value })}
                    />
                </section>

                <hr className={styles.divider} />

                <section className={styles.settingsSection}>
                    <div className={styles.toggleRow}>
                        <div className={styles.toggleInfo}>
                            <h2 style={{ color: settings.maintenance_mode ? '#ef4444' : '#f1f5f9' }}>{t("Modo de Manutenção")}</h2>
                            <p className={styles.hint}>
                                {t("Ao ativar, todos os usuários sem nível de Admin não conseguirão navegar pelo aplicativo, e verão uma página de Manutenção. Use com cuidado.")}
                            </p>
                        </div>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                checked={settings.maintenance_mode}
                                onChange={e => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>
                </section>

                <div className={styles.actions}>
                    <button type="submit" className={styles.btnSave} disabled={saving}>
                        {saving ? t('Salvando...') : t('Aplicar Configurações')}
                    </button>
                </div>
            </form>
        </div>
    );
}
