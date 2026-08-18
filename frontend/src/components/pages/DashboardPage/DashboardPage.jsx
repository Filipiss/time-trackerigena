import DashboardOverview from '../../organisms/DashboardOverview/DashboardOverview';
import './DashboardPage.css';

export default function DashboardPage({ refreshTrigger }) {
  return (
    <div className="dashboard-page fade-in">
      <DashboardOverview refreshTrigger={refreshTrigger} />
    </div>
  );
}
