import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Accessibility, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import './FloatingWidget.css';

export default function FloatingWidget() {
    const { language, setLanguage, t } = useLanguage();
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [isOpen, setIsOpen] = useState(false);
    const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('access_fontSize') || '100', 10));
    const [dyslexic, setDyslexic] = useState(() => localStorage.getItem('access_dyslexic') === 'true');
    const [highContrast, setHighContrast] = useState(() => localStorage.getItem('access_contrast') === 'true');
    const [speechEnabled, setSpeechEnabled] = useState(() => localStorage.getItem('access_speech') === 'true');

    const menuRef = useRef(null);

    // 1. Controle do Tema
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // 2. Controle do Zoom da Fonte
    useEffect(() => {
        document.documentElement.style.fontSize = `${fontSize}%`;
        localStorage.setItem('access_fontSize', String(fontSize));
    }, [fontSize]);

    // 3. Controle de Fonte Disléxica
    useEffect(() => {
        if (dyslexic) {
            document.body.classList.add('accessibility-dyslexic');
        } else {
            document.body.classList.remove('accessibility-dyslexic');
        }
        localStorage.setItem('access_dyslexic', String(dyslexic));
    }, [dyslexic]);

    // 4. Controle de Alto Contraste
    useEffect(() => {
        if (highContrast) {
            document.body.classList.add('accessibility-high-contrast');
        } else {
            document.body.classList.remove('accessibility-high-contrast');
        }
        localStorage.setItem('access_contrast', String(highContrast));
    }, [highContrast]);

    // 5. Controle do Leitor por Voz de Elementos Focalizados/Hover
    useEffect(() => {
        localStorage.setItem('access_speech', String(speechEnabled));
        if (!speechEnabled) {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            return;
        }

        const handleSpeechReading = (textToSpeak) => {
            if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = language === 'pt' ? 'pt-BR' : 'en-US';
            window.speechSynthesis.speak(utterance);
        };

        const handleMouseOver = (e) => {
            e.stopPropagation();
            const el = e.target;
            const text = el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText?.trim();

            if (text && text.length < 200) {
                handleSpeechReading(text);
            }
        };

        const handleFocus = (e) => {
            const el = e.target;
            const text = el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText?.trim();
            if (text && text.length < 200) {
                handleSpeechReading(text);
            }
        };

        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('focusin', handleFocus);

        return () => {
            document.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('focusin', handleFocus);
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        };
    }, [speechEnabled, language]);

    // Fechar menu ao clicar fora
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
        }
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const handleZoomIn = () => {
        setFontSize((prev) => Math.min(prev + 10, 150));
    };

    const handleZoomOut = () => {
        setFontSize((prev) => Math.max(prev - 10, 80));
    };

    const handleZoomReset = () => {
        setFontSize(100);
    };

    return (
        <div className="floating-accessibility-widget" ref={menuRef}>
            {isOpen && (
                <div className="accessibility-panel glass-card-static fade-in">
                    <div className="accessibility-panel-header">
                        <h4>{t("Acessibilidade")}</h4>
                    </div>

                    <div className="accessibility-panel-body">
                        {/* Controle de Fonte */}
                        <div className="accessibility-control-group">
                            <span className="control-group-title">{t("Zoom do Texto")}</span>
                            <div className="zoom-buttons-row">
                                <button onClick={handleZoomOut} className="zoom-btn" title={t("Diminuir Fonte")}>A-</button>
                                <button onClick={handleZoomReset} className="zoom-btn reset" title={t("Resetar Fonte")}>{fontSize}%</button>
                                <button onClick={handleZoomIn} className="zoom-btn" title={t("Aumentar Fonte")}>A+</button>
                            </div>
                        </div>

                        {/* Alternar Fonte para Dislexia */}
                        <div className="accessibility-control-group flex-row">
                            <span className="control-group-title">{t("Fonte Alternativa")}</span>
                            <button
                                className={`toggle-switch-btn ${dyslexic ? 'active' : ''}`}
                                onClick={() => setDyslexic(prev => !prev)}
                            >
                                {dyslexic ? t("Ativado") : t("Desativado")}
                            </button>
                        </div>

                        {/* Alternar Alto Contraste */}
                        <div className="accessibility-control-group flex-row">
                            <span className="control-group-title">{t("Alto Contraste")}</span>
                            <button
                                className={`toggle-switch-btn ${highContrast ? 'active' : ''}`}
                                onClick={() => setHighContrast(prev => !prev)}
                            >
                                {highContrast ? t("Ativado") : t("Desativado")}
                            </button>
                        </div>

                        {/* Leitor de Voz */}
                        <div className="accessibility-control-group flex-row">
                            <span className="control-group-title">{t("Leitor por Voz (Hover)")}</span>
                            <button
                                className={`toggle-switch-btn speech-btn ${speechEnabled ? 'active' : ''}`}
                                onClick={() => setSpeechEnabled(prev => !prev)}
                                title={t("Lê os textos ao passar o mouse ou focar no elemento")}
                            >
                                {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                <span style={{ marginLeft: '4px' }}>{speechEnabled ? t("Ligado") : t("Desligado")}</span>
                            </button>
                        </div>

                        {/* Seletor de Idioma */}
                        <div className="accessibility-control-group flex-row">
                            <span className="control-group-title">{t("Idioma / Language")}</span>
                            <div className="lang-buttons-row">
                                <button
                                    className={`lang-btn ${language === 'pt' ? 'active' : ''}`}
                                    onClick={() => setLanguage('pt')}
                                    title="Português"
                                >
                                    PT
                                </button>
                                <button
                                    className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                                    onClick={() => setLanguage('en')}
                                    title="English"
                                >
                                    EN
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Botões Flutuantes Principais */}
            <div className="floating-buttons-bar">
                <button
                    onClick={toggleTheme}
                    className="widget-float-btn theme-toggle"
                    title={theme === 'light' ? t("Mudar para Tema Escuro") : t("Mudar para Tema Claro")}
                >
                    {theme === 'light' ? <Moon size={18} strokeWidth={2} /> : <Sun size={18} strokeWidth={2} />}
                </button>

                <button
                    onClick={() => setIsOpen(prev => !prev)}
                    className={`widget-float-btn accessibility-toggle ${isOpen ? 'active' : ''}`}
                    title={t("Opções de Acessibilidade")}
                >
                    <Accessibility size={20} strokeWidth={2} />
                </button>
            </div>
        </div>
    );
}
