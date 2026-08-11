import { useEffect, useMemo, useState } from 'react';
import Badge from '../../atoms/Badge/Badge';
import Input from '../../atoms/Input/Input';
import Select from '../../atoms/Select/Select';
import Spinner from '../../atoms/Spinner/Spinner';
import CurrencySelect from '../../molecules/CurrencySelect/CurrencySelect';
import TabButton from '../../molecules/TabButton/TabButton';
import TaskCard from '../../molecules/TaskCard/TaskCard';
import EditModal from '../../organisms/EditModal/EditModal';
import { Pencil, Trash2, Folder, Sparkles, FolderOpen, Blocks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  createCategory,
  createProject,
  createTask,
  deleteCategory,
  deleteProject,
  deleteTask,
  fetchCategories,
  fetchProjects,
  fetchTasks,
  updateCategory,
  updateProject,
  updateTask,
} from '../../../api';
import { CURRENCY_SYMBOLS } from '../../../utils/currency';
import './TaskManagerBoard.css';

export default function TaskManagerBoard({ onTaskChange }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('loco');
  const [creatingProject, setCreatingProject] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTaskColor, setNewTaskColor] = useState('#10b981');
  const [newTaskHourlyRate, setNewTaskHourlyRate] = useState('');
  const [newTaskCurrency, setNewTaskCurrency] = useState('EUR');
  const [newTaskBudgetedHours, setNewTaskBudgetedHours] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [activeTab, setActiveTab] = useState('loco');

  const [editingProject, setEditingProject] = useState(null);
  const [editProjectForm, setEditProjectForm] = useState({ name: '' });

  const [editingTask, setEditingTask] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({ name: '', hourly_rate: '', budgeted_hours: '' });

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        if (active) {
          setLoading(true);
        }
        const [projectData, taskData, categoryData] = await Promise.all([
          fetchProjects(),
          fetchTasks(),
          fetchCategories(),
        ]);
        if (!active) return;
        const safeProjects = projectData || [];
        const safeTasks = taskData || [];
        const safeCategories = categoryData || [];
        setProjects(safeProjects);
        setTasks(safeTasks);
        setCategories(safeCategories);
        setActiveTab((current) => {
          const normalizedCurrent = current?.toLowerCase();
          return safeCategories.some((category) => category.name.toLowerCase() === normalizedCurrent)
            ? normalizedCurrent
            : (safeCategories[0]?.name.toLowerCase() || '');
        });
        setNewProjectCategory((current) => (
          safeCategories.some((category) => category.name === current) ? current : (safeCategories[0]?.name || '')
        ));
        if (safeProjects.length > 0 && !safeProjects.some((project) => String(project.id) === String(newTaskProjectId))) {
          setNewTaskProjectId(String(safeProjects[0].id));
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [newTaskProjectId]);

  const handleCreateProject = async (event) => {
    event.preventDefault();
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    try {
      const project = await createProject({ name: newProjectName.trim(), category: newProjectCategory });
      setProjects((previous) => [...previous, project]);
      setNewProjectName('');
      setNewTaskProjectId((current) => current || String(project.id));
    } catch (error) {
      window.alert(`Erro: ${error.message}`);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const category = await createCategory(newCategoryName.trim());
      setCategories((previous) => [...previous, category]);
      setNewCategoryName('');
      setNewProjectCategory(category.name);
      setActiveTab(category.name.toLowerCase());
    } catch (error) {
      window.alert(`Erro: ${error.message}`);
    }
  };

  const handleEditCategory = async (category) => {
    const name = window.prompt('Novo nome da categoria:', category.name);
    if (!name?.trim() || name.trim() === category.name) return;
    try {
      const updated = await updateCategory(category.id, name.trim());
      setCategories((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
      setProjects((previous) => previous.map((project) => (
        project.category === category.name.toLowerCase() ? { ...project, category: updated.name.toLowerCase() } : project
      )));
      setActiveTab((current) => (current === category.name.toLowerCase() ? updated.name.toLowerCase() : current));
      setNewProjectCategory((current) => (current === category.name ? updated.name : current));
    } catch (error) {
      window.alert(`Erro: ${error.message}`);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm('Excluindo uma categoria, todos os projetos e tarefas associados a ela serão perdidos, deseja continuar?')) return;
    try {
      await deleteCategory(category.id);
      const categoryProjectIds = projects.filter((p) => p.category === category.name.toLowerCase()).map((p) => p.id);
      setProjects((previous) => previous.filter((p) => !categoryProjectIds.includes(p.id)));
      setTasks((previous) => previous.filter((t) => !categoryProjectIds.includes(t.project_id)));
      setCategories((previous) => previous.filter((item) => item.id !== category.id));
      setActiveTab((current) => (current === category.name.toLowerCase() ? '' : current));
      onTaskChange?.();
    } catch (error) {
      window.alert(`Erro: ${error.message}`);
    }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!newTaskName.trim() || !newTaskProjectId) return;
    setCreatingTask(true);
    try {
      const task = await createTask({
        name: newTaskName.trim(),
        project_id: parseInt(newTaskProjectId, 10),
        color: newTaskColor,
        hourly_rate: parseFloat(newTaskHourlyRate) || 0,
        currency: newTaskCurrency,
        budgeted_hours: newTaskBudgetedHours.trim() === '' ? null : parseFloat(newTaskBudgetedHours),
        is_billed: false,
      });
      setTasks((previous) => [...previous, task]);
      setNewTaskName('');
      setNewTaskHourlyRate('');
      setNewTaskBudgetedHours('');
      onTaskChange?.();
    } catch (error) {
      window.alert(`Erro: ${error.message}`);
    } finally {
      setCreatingTask(false);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteTask(id);
      setTasks((previous) => previous.filter((task) => task.id !== id));
      onTaskChange?.();
    } catch (error) {
      window.alert(`Erro: ${error.message}`);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Excluindo um projeto, todas as tarefas e registros de tempo associados a ele serão perdidos, deseja continuar?')) return;
    try {
      await deleteProject(id);
      setProjects((previous) => previous.filter((project) => project.id !== id));
      setTasks((previous) => previous.filter((task) => task.project_id !== id));
      onTaskChange?.();
    } catch (error) {
      window.alert(`Erro: ${error.message}`);
    }
  };

  const toggleBilled = async (task) => {
    try {
      const updated = await updateTask(task.id, { is_billed: !task.is_billed });
      setTasks((previous) => previous.map((item) => (item.id === task.id ? { ...item, is_billed: updated.is_billed } : item)));
      onTaskChange?.();
    } catch (error) {
      window.alert(`Erro: ${error.message}`);
    }
  };

  const handleEditProjectClick = (project) => {
    setEditingProject(project);
    setEditProjectForm({ name: project.name });
  };

  const handleSaveProject = async () => {
    try {
      if (!editingProject || !editProjectForm.name.trim()) return;
      const updated = await updateProject(editingProject.id, { name: editProjectForm.name.trim() });
      setProjects((previous) => previous.map((p) => p.id === updated.id ? updated : p));
      setEditingProject(null);
      onTaskChange?.();
    } catch (error) {
      window.alert(`Erro ao salvar projeto: ${error.message}`);
    }
  };

  const handleEditTaskClick = (task) => {
    setEditingTask(task);
    setEditTaskForm({
      name: task.name,
      hourly_rate: task.hourly_rate || 0,
      budgeted_hours: task.budgeted_hours !== null && task.budgeted_hours !== undefined ? task.budgeted_hours : ''
    });
  };

  const handleSaveTask = async () => {
    try {
      if (!editingTask || !editTaskForm.name.trim()) return;
      const updated = await updateTask(editingTask.id, {
        name: editTaskForm.name.trim(),
        hourly_rate: parseFloat(editTaskForm.hourly_rate) || 0,
        budgeted_hours: editTaskForm.budgeted_hours === '' ? null : parseFloat(editTaskForm.budgeted_hours)
      });
      setTasks((previous) => previous.map((t) => t.id === updated.id ? updated : t));
      setEditingTask(null);
      onTaskChange?.();
    } catch (error) {
      window.alert(`Erro ao salvar task: ${error.message}`);
    }
  };

  const categoryProjects = useMemo(
    () => projects.filter((project) => project.category === activeTab),
    [activeTab, projects],
  );

  if (loading) {
    return <div className="loading-container"><Spinner /></div>;
  }

  return (
    <div className="task-manager fade-in">
      <div className="task-manager-header">
        <h2 className="task-manager-title gradient-text"><Blocks size={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} strokeWidth={1.5} /> Gerenciar Projetos e Tasks</h2>
      </div>

      <div className="forms-grid">
        <form className="task-form glass-card-static" onSubmit={handleCreateCategory}>
          <div className="task-form-title">Nova Categoria</div>
          <div className="task-form-field">
            <label className="task-form-label">Nome</label>
            <Input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary task-form-submit">+ Criar Categoria</button>
          <div className="category-badges-grid">
            {categories.map((category) => (
              <Badge key={category.id} className="badge category-admin-badge">
                <span className="truncate">{category.name}</span>
                <button type="button" className="btn-icon" onClick={() => handleEditCategory(category)} title="Editar categoria">
                  <Pencil size={14} strokeWidth={1.5} />
                </button>
                <button type="button" className="btn-icon" onClick={() => handleDeleteCategory(category)} title="Excluir categoria" style={{ color: 'var(--color-danger)' }}>
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </Badge>
            ))}
          </div>
        </form>

        <form className="task-form glass-card-static" onSubmit={handleCreateProject}>
          <div className="task-form-title"><FolderOpen size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} strokeWidth={1.5} /> Novo Projeto</div>
          <div className="task-form-field">
            <label className="task-form-label">Nome do Projeto</label>
            <Input value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} required />
          </div>
          <div className="task-form-field task-form-spacing">
            <label className="task-form-label">Categoria</label>
            <Select value={newProjectCategory} onChange={(event) => setNewProjectCategory(event.target.value)} required>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </Select>
          </div>
          <button type="submit" className="btn btn-primary task-form-submit" disabled={creatingProject}>+ Criar Projeto</button>
        </form>

        <form className="task-form glass-card-static" onSubmit={handleCreateTask}>
          <div className="task-form-title"><Sparkles size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} strokeWidth={1.5} /> Nova Task</div>
          <div className="task-form-field">
            <label className="task-form-label">Nome da Task</label>
            <Input value={newTaskName} onChange={(event) => setNewTaskName(event.target.value)} required />
          </div>
          <div className="task-form-field task-form-spacing">
            <label className="task-form-label">Projeto</label>
            <Select value={newTaskProjectId} onChange={(event) => setNewTaskProjectId(event.target.value)} required>
              <option value="">Selecione um projeto...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>[{project.category}] {project.name}</option>
              ))}
            </Select>
          </div>
          <div className="task-form-inline-row">
            <div className="task-form-field task-form-currency-field">
              <label className="task-form-label">Moeda</label>
              <CurrencySelect value={newTaskCurrency} onChange={(event) => setNewTaskCurrency(event.target.value)} />
            </div>
            <div className="task-form-field task-form-inline-field">
              <label className="task-form-label">Valor/Hora</label>
              <Input type="number" step="0.01" value={newTaskHourlyRate} onChange={(event) => setNewTaskHourlyRate(event.target.value)} placeholder={`${CURRENCY_SYMBOLS[newTaskCurrency] || '$'}`} />
            </div>
            <div className="task-form-field task-form-inline-field">
              <label className="task-form-label">Horas Orçadas</label>
              <Input type="number" step="0.5" min="0" value={newTaskBudgetedHours} onChange={(event) => setNewTaskBudgetedHours(event.target.value)} placeholder={`${CURRENCY_SYMBOLS[newTaskCurrency] || '$'}`} />
            </div>
            <div className="task-form-field task-color-field">
              <label className="task-form-label">Cor</label>
              <input type="color" className="color-picker" value={newTaskColor} onChange={(event) => setNewTaskColor(event.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary task-form-submit" disabled={creatingTask}>+ Criar Task</button>
        </form>
      </div>

      <div className="category-tabs-scroll">
        <div className="category-tabs">
          {categories.map((category) => (
            <TabButton
              key={category.id}
              className={`tab-btn ${activeTab === category.name.toLowerCase() ? 'active-loco' : ''}`}
              isActive={activeTab === category.name.toLowerCase()}
              onClick={() => setActiveTab(category.name.toLowerCase())}
            >
              {category.name}
            </TabButton>
          ))}
        </div>
      </div>

      <div className="projects-grid">
        {categoryProjects.length === 0 ? <p className="empty-msg">Nenhum projeto encontrado.</p> : null}
        {categoryProjects.map((project) => {
          const projectTasks = tasks.filter((task) => task.project_id === project.id);
          return (
            <div key={project.id} className="project-folder">
              <div className="project-folder-tab" onClick={() => navigate('/history?tab=faturamento')} title="Ver Faturamento deste projeto">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Folder size={16} strokeWidth={1.5} /> {project.name}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className="btn-icon"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEditProjectClick(project);
                    }}
                    title="Editar Projeto"
                  >
                    <Pencil size={16} strokeWidth={1.5} />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    style={{ color: 'var(--color-danger)' }}
                    title="Excluir Projeto"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
              <div className="project-folder-body glass-card">
                <div className="task-cards-list">
                  {projectTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      variant="manager"
                      task={task}
                      currencySymbol={CURRENCY_SYMBOLS[task.currency || 'EUR']}
                      onToggleBilled={toggleBilled}
                      onDelete={handleDeleteTask}
                      onEdit={handleEditTaskClick}
                    />
                  ))}
                  {projectTasks.length === 0 ? <span className="empty-msg task-list-empty">Sem tasks neste projeto.</span> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <EditModal isOpen={!!editingProject} title="Editar Projeto" onClose={() => setEditingProject(null)} onSave={handleSaveProject}>
        <div className="edit-modal-field">
          <label className="edit-modal-label">Nome do Projeto</label>
          <Input value={editProjectForm.name} onChange={e => setEditProjectForm({ ...editProjectForm, name: e.target.value })} required />
        </div>
      </EditModal>

      <EditModal isOpen={!!editingTask} title="Editar Tarefa" onClose={() => setEditingTask(null)} onSave={handleSaveTask}>
        <div className="edit-modal-field">
          <label className="edit-modal-label">Nome da Tarefa</label>
          <Input value={editTaskForm.name} onChange={e => setEditTaskForm({ ...editTaskForm, name: e.target.value })} required />
        </div>
        <div className="edit-modal-field">
          <label className="edit-modal-label">Valor / Hora</label>
          <Input type="number" step="0.01" value={editTaskForm.hourly_rate} onChange={e => setEditTaskForm({ ...editTaskForm, hourly_rate: e.target.value })} />
        </div>
        <div className="edit-modal-field">
          <label className="edit-modal-label">Horas Orçadas (Opicional)</label>
          <Input type="number" step="0.1" value={editTaskForm.budgeted_hours} onChange={e => setEditTaskForm({ ...editTaskForm, budgeted_hours: e.target.value })} />
        </div>
      </EditModal>

    </div>
  );
}
