import { useEffect, useMemo, useState } from 'react';
import Spinner from '../../atoms/Spinner/Spinner';
import CalendarBoard from '../../organisms/CalendarBoard/CalendarBoard';
import DeadlineModal from '../../organisms/DeadlineModal/DeadlineModal';
import { fetchProjectDeadlineHistory, fetchTaskDeadlineHistory, fetchProjects, fetchTasks, updateProject, updateTask } from '../../../api';
import './CalendarPage.css';

const STATUS_CONFIG = {
  aguardando_cliente: { label: 'Aguardando Cliente', color: '#3b82f6' },
  em_andamento: { label: 'Em Andamento', color: '#8b5cf6' },
  em_revisao: { label: 'Em Revisão', color: '#f59e0b' },
  deadline: { label: 'Deadline', color: '#ef4444' },
  completo: { label: 'Entregue', color: '#10b981' },
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
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [editingEventId, setEditingEventId] = useState(null); // replaces editingProjectId
  const [editingType, setEditingType] = useState(null); // 'project' | 'task'
  const [creatingForDate, setCreatingForDate] = useState(null);
  const [formDeadline, setFormDeadline] = useState('');
  const [formStatus, setFormStatus] = useState('em_andamento');
  const [formNotes, setFormNotes] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formTaskId, setFormTaskId] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        if (active) setLoading(true);
        const [projectsData, tasksData] = await Promise.all([
          fetchProjects(),
          fetchTasks()
        ]);
        if (active) {
          setProjects(projectsData || []);
          setTasks(tasksData || []);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do calendário:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const eventsByDate = useMemo(() => {
    const map = {};
    projects.forEach((item) => {
      if (item.deadline) {
        if (!map[item.deadline]) map[item.deadline] = [];
        map[item.deadline].push({ ...item, eventType: 'project' });
      }
    });
    tasks.forEach((item) => {
      if (item.deadline) {
        if (!map[item.deadline]) map[item.deadline] = [];
        map[item.deadline].push({ ...item, eventType: 'task' });
      }
    });
    return map;
  }, [projects, tasks]);

  const projectsWithoutDeadline = useMemo(() => projects.filter((project) => !project.deadline), [projects]);
  const monthGrid = useMemo(() => buildMonthGrid(monthDate), [monthDate]);
  const currentMonthIndex = monthDate.getMonth();
  const todayISO = toISODate(new Date());

  const openCreateModal = (isoDate) => {
    setCreatingForDate(isoDate);
    setEditingEventId(null);
    setEditingType(null);
    setFormProjectId(projectsWithoutDeadline[0]?.id || projects[0]?.id || '');
    setFormTaskId('');
    setFormDeadline(isoDate);
    setFormStatus('em_andamento');
    setFormNotes('');
    setHistory([]);
  };

  const openEditModal = async (event) => {
    setEditingEventId(event.id);
    setEditingType(event.eventType);
    setCreatingForDate(null);
    setFormProjectId(event.eventType === 'task' ? event.project_id : event.id);
    setFormTaskId(event.eventType === 'task' ? event.id : '');
    setFormDeadline(event.deadline || '');
    setFormStatus(event.status || 'em_andamento');
    setFormNotes(event.notes || '');
    setLoadingHistory(true);
    try {
      const data = event.eventType === 'task'
        ? await fetchTaskDeadlineHistory(event.id)
        : await fetchProjectDeadlineHistory(event.id);
      setHistory(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeModal = () => {
    setEditingEventId(null);
    setEditingType(null);
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
      if (formTaskId) {
        // Saving task deadline
        const updated = await updateTask(formTaskId, {
          deadline: formDeadline || null,
          status: formStatus,
          notes: formNotes.trim() || null,
        });
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      } else {
        // Saving project deadline
        const updated = await updateProject(formProjectId, {
          deadline: formDeadline || null,
          status: formStatus,
          notes: formNotes.trim() || null,
        });
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      }
      closeModal();
    } catch (error) {
      window.alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDeadline = async () => {
    if (!editingEventId) return;
    setSaving(true);
    try {
      if (editingType === 'task') {
        const updated = await updateTask(editingEventId, { deadline: null });
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      } else {
        const updated = await updateProject(editingEventId, { deadline: null });
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      }
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
        eventsByDate={eventsByDate}
        statusConfig={STATUS_CONFIG}
        weekdayLabels={WEEKDAY_LABELS}
        onPrevMonth={() => setMonthDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
        onNextMonth={() => setMonthDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
        onToday={() => {
          const now = new Date();
          setMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
        }}
        onCreateDeadline={openCreateModal}
        onEditEvent={openEditModal}
      />
      <DeadlineModal
        open={editingEventId !== null || creatingForDate !== null}
        editingEventId={editingEventId}
        editingType={editingType}
        projects={projects}
        tasks={tasks}
        formProjectId={formProjectId}
        setFormProjectId={(pid) => {
          setFormProjectId(pid);
          // Auto-reset task when changing project
          setFormTaskId('');
        }}
        formTaskId={formTaskId}
        setFormTaskId={setFormTaskId}
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
