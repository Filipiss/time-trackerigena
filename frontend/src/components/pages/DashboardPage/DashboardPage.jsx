import DashboardOverview from '../../organisms/DashboardOverview/DashboardOverview';
import './DashboardPage.css';

export default function DashboardPage({ refreshTrigger }) {
  return (
    <div className="l-dashboard-page u-fade-in">
      <DashboardOverview refreshTrigger={refreshTrigger} />
    </div>
  );
}
