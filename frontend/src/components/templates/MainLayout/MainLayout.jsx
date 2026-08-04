import Sidebar from '../../organisms/Sidebar/Sidebar';
import './MainLayout.css';

export default function MainLayout({ activeTab, onTabChange, children }) {
  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      <main className="app-main">
        <div className="content-container">{children}</div>
      </main>
    </div>
  );
}
