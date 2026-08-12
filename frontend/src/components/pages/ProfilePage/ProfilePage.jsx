import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { apiUpdateProfile } from '../../../api';
import { validate_password_strength_js } from '../../../utils/passwordStrength';
import { apiChangePassword } from '../../../api';
import { Check, Circle, Camera } from 'lucide-react';
import './ProfilePage.css';

const COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
    'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Belize',
    'Benin', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
    'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic',
    'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
    'Czech Republic', 'Denmark', 'Djibouti', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
    'Equatorial Guinea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
    'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Guinea', 'Haiti', 'Honduras',
    'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
    'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos',
    'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Mauritania', 'Mauritius',
    'Mexico', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea',
    'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palestine', 'Panama', 'Papua New Guinea',
    'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
    'Saudi Arabia', 'Senegal', 'Serbia', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
    'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan',
    'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand',
    'Togo', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Uganda', 'Ukraine',
    'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
    'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const fileRef = useRef(null);
    const [form, setForm] = useState({ full_name: '', country: '', phone: '', avatar_url: '' });
    const [countrySearch, setCountrySearch] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
    const [pwdError, setPwdError] = useState('');
    const [pwdSaving, setPwdSaving] = useState(false);
    const [strength, setStrength] = useState({ score: 0, errors: [] });

    useEffect(() => {
        if (user) {
            setForm({
                full_name: user.full_name || '',
                country: user.country || '',
                phone: user.phone || '',
                avatar_url: user.avatar_url || '',
            });
            setCountrySearch(user.country || '');
        }
    }, [user]);

    useEffect(() => {
        if (pwdForm.next) setStrength(validate_password_strength_js(pwdForm.next));
        else setStrength({ score: 0, errors: [] });
    }, [pwdForm.next]);

    const filteredCountries = COUNTRIES.filter(c =>
        c.toLowerCase().includes(countrySearch.toLowerCase())
    );

    function handleAvatarChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setForm(f => ({ ...f, avatar_url: ev.target.result }));
        reader.readAsDataURL(file);
    }

    async function handleSaveProfile(e) {
        e.preventDefault();
        setSaving(true);
        try {
            await apiUpdateProfile(form);
            await refreshUser();
            showToast('Perfil salvo com sucesso!');
        } catch (err) {
            showToast('Erro ao salvar: ' + err.message, true);
        } finally {
            setSaving(false);
        }
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        setPwdError('');
        if (pwdForm.next !== pwdForm.confirm) { setPwdError('As senhas não coincidem'); return; }
        const errs = validate_password_strength_js(pwdForm.next).errors;
        if (errs.length) { setPwdError(errs[0]); return; }
        setPwdSaving(true);
        try {
            await apiChangePassword(pwdForm.current, pwdForm.next);
            setPwdForm({ current: '', next: '', confirm: '' });
            showToast('Senha alterada com sucesso!');
        } catch (err) {
            setPwdError(err.message);
        } finally {
            setPwdSaving(false);
        }
    }

    const showToast = useCallback((msg, isError = false) => {
        setToast({ msg, isError });
        setTimeout(() => setToast(''), 3000);
    }, []);

    const initials = (form.full_name || user?.username || '?')
        .split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('');

    const pwdRules = [
        { label: 'Mínimo 8 caracteres', ok: pwdForm.next.length >= 8 },
        { label: 'Letra minúscula', ok: /[a-z]/.test(pwdForm.next) },
        { label: 'Letra maiúscula', ok: /[A-Z]/.test(pwdForm.next) },
        { label: 'Número', ok: /\d/.test(pwdForm.next) },
        { label: 'Caractere especial', ok: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwdForm.next) },
    ];
    const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][strength.score] || '#444';

    return (
        <div className="profile-page">
            {toast && (
                <div className={`profile-toast ${toast.isError ? 'profile-toast--error' : ''}`}>
                    {toast.msg}
                </div>
            )}

            <h1 className="profile-title">Meu Perfil</h1>

            {!user ? (
                <div className="profile-guest-notice">
                    <p style={{ color: '#ccc' }}>O perfil não está disponível no Modo Visitante.</p>
                    <p style={{ color: '#888', fontSize: '14px', marginTop: '8px' }}>Cadastre-se para personalizar sua experiência e salvar seus dados na nuvem!</p>
                </div>
            ) : (
                <div className="profile-grid">
                    {/* ── Card: Avatar + identidade ── */}
                    <section className="profile-card">
                        <h2 className="card-heading">Foto e identidade</h2>

                        <div className="avatar-area">
                            <button className="avatar-btn" onClick={() => fileRef.current?.click()} title="Trocar foto">
                                {form.avatar_url ? (
                                    <img src={form.avatar_url} alt="avatar" className="avatar-img" />
                                ) : (
                                    <div className="avatar-initials">{initials}</div>
                                )}
                                <div className="avatar-overlay"><Camera size={20} strokeWidth={1.5} /></div>
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                            <p className="avatar-hint">Clique para trocar a foto</p>
                        </div>

                        <form onSubmit={handleSaveProfile} className="profile-form">
                            <div className="field-group">
                                <label>Username</label>
                                <input value={user?.username || ''} readOnly className="field-readonly" />
                            </div>

                            <div className="field-group">
                                <label>Nome completo</label>
                                <input
                                    value={form.full_name}
                                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                                    placeholder="Seu nome completo"
                                />
                            </div>

                            <div className="field-group">
                                <label>E-mail</label>
                                <input value={user?.email || ''} readOnly className="field-readonly" />
                            </div>

                            <div className="field-group country-field">
                                <label>País de origem</label>
                                <input
                                    value={countrySearch}
                                    onChange={e => {
                                        setCountrySearch(e.target.value);
                                        setForm(f => ({ ...f, country: '' }));
                                        setShowCountryDropdown(true);
                                    }}
                                    onFocus={() => setShowCountryDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowCountryDropdown(false), 180)}
                                    placeholder="Buscar país…"
                                    autoComplete="off"
                                />
                                {showCountryDropdown && filteredCountries.length > 0 && (
                                    <ul className="country-dropdown">
                                        {filteredCountries.slice(0, 8).map(c => (
                                            <li key={c} onMouseDown={() => {
                                                setForm(f => ({ ...f, country: c }));
                                                setCountrySearch(c);
                                                setShowCountryDropdown(false);
                                            }}>{c}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="field-group">
                                <label>Telefone / WhatsApp</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                    placeholder="+55 (11) 99999-9999"
                                    maxLength={30}
                                />
                            </div>

                            <button type="submit" className="btn-save" disabled={saving}>
                                {saving ? 'Salvando…' : 'Salvar perfil'}
                            </button>
                        </form>
                    </section>

                    {/* ── Card: Trocar senha ── */}
                    <section className="profile-card">
                        <h2 className="card-heading">Alterar senha</h2>

                        {pwdError && <div className="pwd-error">{pwdError}</div>}

                        <form onSubmit={handleChangePassword} className="profile-form">
                            <div className="field-group">
                                <label>Senha atual</label>
                                <input type="password" value={pwdForm.current}
                                    onChange={e => setPwdForm(f => ({ ...f, current: e.target.value }))}
                                    placeholder="Senha atual" autoComplete="current-password" />
                            </div>

                            <div className="field-group">
                                <label>Nova senha</label>
                                <input type="password" value={pwdForm.next}
                                    onChange={e => setPwdForm(f => ({ ...f, next: e.target.value }))}
                                    placeholder="Nova senha segura" autoComplete="new-password" />
                                {pwdForm.next && (
                                    <>
                                        <div className="strength-bar-wrap">
                                            <div className="strength-bar" style={{ width: `${strength.score * 20}%`, background: strengthColor }} />
                                        </div>
                                        <ul className="rules-list">
                                            {pwdRules.map(r => (
                                                <li key={r.label} className={r.ok ? 'rule-ok' : 'rule-fail'}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                        {r.ok ? <Check size={14} strokeWidth={2} /> : <Circle size={14} strokeWidth={1.5} />}
                                                    </span> {r.label}
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>

                            <div className="field-group">
                                <label>Confirmar nova senha</label>
                                <input type="password" value={pwdForm.confirm}
                                    onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))}
                                    placeholder="Repita a nova senha" autoComplete="new-password" />
                            </div>

                            <button type="submit" className="btn-save" disabled={pwdSaving}>
                                {pwdSaving ? 'Alterando…' : 'Alterar senha'}
                            </button>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}
