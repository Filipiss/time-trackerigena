import AuthButtons from '../../molecules/AuthButtons/AuthButtons';
import Sidebar from '../../organisms/Sidebar/Sidebar';
import './MainLayout.css';

export default function MainLayout({ activeTab, onTabChange, children }) {
  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

      <div className="app-content-wrapper">
        {/* Barra superior com botões de auth no canto direito */}
        <header className="app-topbar">
          <div className="topbar-spacer" />
          <AuthButtons />
        </header>

        <main className="app-main">
          <div className="content-container">{children}</div>
        </main>
      </div>
    </div>
  );
}
