import { Outlet } from 'react-router-dom';
import AuthButtons from '../../molecules/AuthButtons/AuthButtons';
import Sidebar from '../../organisms/Sidebar/Sidebar';
import './MainLayout.css';

export default function MainLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-content-wrapper">
        {/* Barra superior com botões de auth no canto direito */}
        <header className="app-topbar">
          <div className="topbar-spacer" />
          <AuthButtons />
        </header>

        <main className="app-main">
          <div className="content-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
