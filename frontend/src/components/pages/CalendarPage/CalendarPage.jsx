import { useEffect, useMemo, useState } from 'react';
import Spinner from '../../atoms/Spinner/Spinner';
import CalendarBoard from '../../organisms/CalendarBoard/CalendarBoard';
import DeadlineModal from '../../organisms/DeadlineModal/DeadlineModal';
import { fetchProjectDeadlineHistory, fetchProjects, updateProject } from '../../../api';
import './CalendarPage.css';

const STATUS_CONFIG = {
  em_andamento: { label: 'Em Andamento', color: '#8b5cf6' },
  urgente: { label: 'Urgente', color: '#ef4444' },
  em_revisao: { label: 'Em Revisão', color: '#f59e0b' },
  aguardando_cliente: { label: 'Aguardando Cliente', color: '#3b82f6' },
  completo: { label: 'Completo', color: '#10b981' },
};

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildMonthGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const cells = [];
  for (let index = 0; index < totalCells; index += 1) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    cells.push(cellDate);
  }
  return cells;
}

export default function CalendarPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [creatingForDate, setCreatingForDate] = useState(null);
  const [formDeadline, setFormDeadline] = useState('');
  const [formStatus, setFormStatus] = useState('em_andamento');
  const [formNotes, setFormNotes] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProjects = async () => {
      try {
        if (active) {
          setLoading(true);
        }
        const data = await fetchProjects();
        if (active) {
          setProjects(data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);

  const projectsByDate = useMemo(() => {
    const map = {};
    projects.forEach((project) => {
      if (project.deadline) {
        if (!map[project.deadline]) {
          map[project.deadline] = [];
        }
        map[project.deadline].push(project);
      }
    });
    return map;
  }, [projects]);

  const projectsWithoutDeadline = useMemo(() => projects.filter((project) => !project.deadline), [projects]);
  const monthGrid = useMemo(() => buildMonthGrid(monthDate), [monthDate]);
  const currentMonthIndex = monthDate.getMonth();
  const todayISO = toISODate(new Date());

  const openCreateModal = (isoDate) => {
    setCreatingForDate(isoDate);
    setEditingProjectId(null);
    setFormProjectId(projectsWithoutDeadline[0]?.id || '');
    setFormDeadline(isoDate);
    setFormStatus('em_andamento');
    setFormNotes('');
    setHistory([]);
  };

  const openEditModal = async (project) => {
    setEditingProjectId(project.id);
    setCreatingForDate(null);
    setFormProjectId(project.id);
    setFormDeadline(project.deadline || '');
    setFormStatus(project.status || 'em_andamento');
    setFormNotes(project.notes || '');
    setLoadingHistory(true);
    try {
      const data = await fetchProjectDeadlineHistory(project.id);
      setHistory(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeModal = () => {
    setEditingProjectId(null);
    setCreatingForDate(null);
    setHistory([]);
  };

  const handleSave = async () => {
    if (!formProjectId) {
      window.alert('Selecione um projeto.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProject(formProjectId, {
        deadline: formDeadline || null,
        status: formStatus,
        notes: formNotes.trim() || null,
      });
      setProjects((previous) => previous.map((project) => (project.id === updated.id ? { ...project, ...updated } : project)));
      closeModal();
    } catch (error) {
      window.alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDeadline = async () => {
    if (!editingProjectId) return;
    setSaving(true);
    try {
      const updated = await updateProject(editingProjectId, { deadline: null });
      setProjects((previous) => previous.map((project) => (project.id === updated.id ? { ...project, ...updated } : project)));
      closeModal();
    } catch (error) {
      window.alert(`Erro ao remover deadline: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="calendar-loading"><Spinner /></div>;
  }

  return (
    <div className="calendar-page-shell fade-in">
      <CalendarBoard
        monthDate={monthDate}
        monthGrid={monthGrid}
        currentMonthIndex={currentMonthIndex}
        todayISO={todayISO}
        projectsByDate={projectsByDate}
        statusConfig={STATUS_CONFIG}
        weekdayLabels={WEEKDAY_LABELS}
        onPrevMonth={() => setMonthDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
        onNextMonth={() => setMonthDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
        onToday={() => {
          const now = new Date();
          setMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
        }}
        onCreateDeadline={openCreateModal}
        onEditProject={openEditModal}
      />
      <DeadlineModal
        open={editingProjectId !== null || creatingForDate !== null}
        editingProjectId={editingProjectId}
        projects={projects}
        formProjectId={formProjectId}
        setFormProjectId={setFormProjectId}
        formDeadline={formDeadline}
        setFormDeadline={setFormDeadline}
        formStatus={formStatus}
        setFormStatus={setFormStatus}
        formNotes={formNotes}
        setFormNotes={setFormNotes}
        statusConfig={STATUS_CONFIG}
        loadingHistory={loadingHistory}
        history={history}
        saving={saving}
        onClose={closeModal}
        onRemoveDeadline={handleRemoveDeadline}
        onSave={handleSave}
      />
    </div>
  );
}
