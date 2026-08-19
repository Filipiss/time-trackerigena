import { Outlet } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import AuthButtons from '../../molecules/AuthButtons/AuthButtons';
import Sidebar from '../../organisms/Sidebar/Sidebar';
import './MainLayout.css';

export default function MainLayout({ settings }) {
  const [dismissedBanner, setDismissedBanner] = useState(() => sessionStorage.getItem('dismissed_banner') || '');

  const handleCloseBanner = useCallback(() => {
    if (settings?.global_banner) {
      setDismissedBanner(settings.global_banner);
      sessionStorage.setItem('dismissed_banner', settings.global_banner);
    }
  }, [settings]);

  useEffect(() => {
    // Se o admin deletou a mensagem, limpa a memória de bloqueio da sessão
    if (settings && !settings.global_banner?.trim()) {
      setTimeout(() => {
        setDismissedBanner('');
        sessionStorage.removeItem('dismissed_banner');
      }, 0);
    }
  }, [settings]);

  useEffect(() => {
    // Timer para fechar automaticamente após 30 segundos
    if (settings?.global_banner?.trim() && settings.global_banner !== dismissedBanner) {
      const timer = setTimeout(() => {
        handleCloseBanner();
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [settings?.global_banner, dismissedBanner, handleCloseBanner]);

  const showBanner = settings?.global_banner?.trim() && settings.global_banner !== dismissedBanner;
  return (
    <div className="l-app">
      <Sidebar />

      <div className="l-app__content">
        {/* Barra superior com botões de auth no canto direito */}
        <header className="l-app__topbar">
          <div className="l-app__topbar-spacer" />
          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AuthButtons />
          </div>
        </header>

        {showBanner && (
          <div style={{ background: '#3b82f6', color: 'white', padding: '0.75rem 2.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '500', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', position: 'relative', zIndex: 10 }}>
            <span style={{ fontSize: '1.2rem' }}>👽🖖</span>
            <span><strong>Aliens intergaláticos informam:</strong> {settings.global_banner}</span>
            <button
              onClick={handleCloseBanner}
              style={{ position: 'absolute', right: '1rem', background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', lineHeight: '1', padding: '0 5px' }}
              aria-label="Fechar"
              title="Fechar aviso">
              &times;
            </button>
          </div>
        )}

        <main className="l-app__main">
          <div className="l-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
