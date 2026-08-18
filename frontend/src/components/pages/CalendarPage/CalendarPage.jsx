import { useEffect, useMemo, useState } from 'react';
import Spinner from '../../atoms/Spinner/Spinner';
import CalendarBoard from '../../organisms/CalendarBoard/CalendarBoard';
import DeadlineModal from '../../organisms/DeadlineModal/DeadlineModal';
import { fetchProjects, fetchTasks, getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../../../api';
import { useLanguage } from '../../../contexts/LanguageContext';
import './CalendarPage.css';

const STATUS_CONFIG_PT = {
  aguardando_cliente: { label: 'Aguardando Cliente', color: '#3b82f6' },
  em_andamento: { label: 'Em Andamento', color: '#8b5cf6' },
  em_revisao: { label: 'Em Revisão', color: '#f59e0b' },
  deadline: { label: 'Deadline', color: '#ef4444' },
  completo: { label: 'Entregue', color: '#10b981' },
};
const STATUS_CONFIG_EN = {
  aguardando_cliente: { label: 'Awaiting Client', color: '#3b82f6' },
  em_andamento: { label: 'In Progress', color: '#8b5cf6' },
  em_revisao: { label: 'Under Review', color: '#f59e0b' },
  deadline: { label: 'Deadline', color: '#ef4444' },
  completo: { label: 'Delivered', color: '#10b981' },
};
const WEEKDAY_LABELS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  const { language } = useLanguage();
  const STATUS_CONFIG = language === 'en' ? STATUS_CONFIG_EN : STATUS_CONFIG_PT;
  const WEEKDAY_LABELS = language === 'en' ? WEEKDAY_LABELS_EN : WEEKDAY_LABELS_PT;
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
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
        const [projectsData, tasksData, eventsData] = await Promise.all([
          fetchProjects(),
          fetchTasks(),
          getCalendarEvents()
        ]);
        if (active) {
          setProjects(projectsData || []);
          setTasks(tasksData || []);
          setCalendarEvents(eventsData || []);
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
    calendarEvents.forEach((ev) => {
      if (ev.date) {
        if (!map[ev.date]) map[ev.date] = [];

        const p = projects.find(proj => proj.id === ev.project_id);
        const t = tasks.find(tsk => tsk.id === ev.task_id);
        const name = (ev.task_id && t) ? t.name : (p ? p.name : 'Desconhecido');
        const category = p ? p.category : '';

        map[ev.date].push({
          ...ev,
          name,
          category,
          eventType: ev.task_id ? 'task' : 'project'
        });
      }
    });
    return map;
  }, [calendarEvents, projects, tasks]);

  const projectsWithoutDeadline = useMemo(() => {
    return projects.filter(p => !calendarEvents.some(ev => ev.project_id === p.id));
  }, [projects, calendarEvents]);
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
    setFormProjectId(event.project_id || '');
    setFormTaskId(event.task_id || '');
    setFormDeadline(event.date || '');
    setFormStatus(event.status || 'em_andamento');
    setFormNotes(event.notes || '');
    setHistory([]);
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
      const payload = {
        project_id: formProjectId || null,
        task_id: formTaskId || null,
        date: formDeadline || null,
        status: formStatus,
        notes: formNotes.trim() || null
      };

      if (editingEventId) {
        const updated = await updateCalendarEvent(editingEventId, payload);
        setCalendarEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
      } else {
        const created = await createCalendarEvent(payload);
        setCalendarEvents((prev) => [...prev, created]);
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
      await deleteCalendarEvent(editingEventId);
      setCalendarEvents((prev) => prev.filter((ev) => ev.id !== editingEventId));
      closeModal();
    } catch (error) {
      window.alert(`Erro ao remover compromisso: ${error.message}`);
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
