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

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.style.fontSize = `${fontSize}%`;
        localStorage.setItem('access_fontSize', String(fontSize));
    }, [fontSize]);

    useEffect(() => {
        if (dyslexic) {
            document.body.classList.add('has-dyslexic-font');
        } else {
            document.body.classList.remove('has-dyslexic-font');
        }
        localStorage.setItem('access_dyslexic', String(dyslexic));
    }, [dyslexic]);

    useEffect(() => {
        if (highContrast) {
            document.body.classList.add('has-high-contrast');
        } else {
            document.body.classList.remove('has-high-contrast');
        }
        localStorage.setItem('access_contrast', String(highContrast));
    }, [highContrast]);

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
        <div className="c-floating-widget" ref={menuRef}>
            {isOpen && (
                <div className="c-floating-widget__panel o-card--static u-fade-in">
                    <div className="c-floating-widget__panel-header">
                        <h4>{t("Acessibilidade")}</h4>
                    </div>

                    <div className="c-floating-widget__panel-body">

                        <div className="c-floating-widget__control-group">
                            <span className="c-floating-widget__group-title">{t("Zoom do Texto")}</span>
                            <div className="c-floating-widget__zoom-row">
                                <button onClick={handleZoomOut} className="c-floating-widget__zoom-btn" title={t("Diminuir Fonte")}>A-</button>
                                <button onClick={handleZoomReset} className="c-floating-widget__zoom-btn c-floating-widget__zoom-btn--reset" title={t("Resetar Fonte")}>{fontSize}%</button>
                                <button onClick={handleZoomIn} className="c-floating-widget__zoom-btn" title={t("Aumentar Fonte")}>A+</button>
                            </div>
                        </div>

                        <div className="c-floating-widget__control-group c-floating-widget__control-group--row">
                            <span className="c-floating-widget__group-title">{t("Fonte Alternativa")}</span>
                            <button
                                className={`c-floating-widget__toggle-btn ${dyslexic ? 'is-active' : ''}`}
                                onClick={() => setDyslexic(prev => !prev)}
                            >
                                {dyslexic ? t("Ativado") : t("Desativado")}
                            </button>
                        </div>

                        <div className="c-floating-widget__control-group c-floating-widget__control-group--row">
                            <span className="c-floating-widget__group-title">{t("Alto Contraste")}</span>
                            <button
                                className={`c-floating-widget__toggle-btn ${highContrast ? 'is-active' : ''}`}
                                onClick={() => setHighContrast(prev => !prev)}
                            >
                                {highContrast ? t("Ativado") : t("Desativado")}
                            </button>
                        </div>

                        <div className="c-floating-widget__control-group c-floating-widget__control-group--row">
                            <span className="c-floating-widget__group-title">{t("Leitor por Voz (Hover)")}</span>
                            <button
                                className={`c-floating-widget__toggle-btn c-floating-widget__speech-btn ${speechEnabled ? 'is-active' : ''}`}
                                onClick={() => setSpeechEnabled(prev => !prev)}
                                title={t("Lê os textos ao passar o mouse ou focar no elemento")}
                            >
                                {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                <span style={{ marginLeft: '4px' }}>{speechEnabled ? t("Ligado") : t("Desligado")}</span>
                            </button>
                        </div>

                        <div className="c-floating-widget__control-group c-floating-widget__control-group--row">
                            <span className="c-floating-widget__group-title">{t("Idioma / Language")}</span>
                            <div className="c-floating-widget__lang-row">
                                <button
                                    className={`c-floating-widget__lang-btn ${language === 'pt' ? 'is-active' : ''}`}
                                    onClick={() => setLanguage('pt')}
                                    title="Português"
                                >
                                    PT
                                </button>
                                <button
                                    className={`c-floating-widget__lang-btn ${language === 'en' ? 'is-active' : ''}`}
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

            <div className="c-floating-widget__bar">
                <button
                    onClick={toggleTheme}
                    className="c-floating-widget__btn"
                    title={theme === 'light' ? t("Mudar para Tema Escuro") : t("Mudar para Tema Claro")}
                >
                    {theme === 'light' ? <Moon size={18} strokeWidth={2} /> : <Sun size={18} strokeWidth={2} />}
                </button>

                <button
                    onClick={() => setIsOpen(prev => !prev)}
                    className={`c-floating-widget__btn ${isOpen ? 'is-active' : ''}`}
                    title={t("Opções de Acessibilidade")}
                >
                    <Accessibility size={20} strokeWidth={2} />
                </button>
            </div>
        </div>
    );
}
