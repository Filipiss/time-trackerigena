import { useEffect, useMemo, useState } from 'react';
import Badge from '../../atoms/Badge/Badge';
import Input from '../../atoms/Input/Input';
import Select from '../../atoms/Select/Select';
import Spinner from '../../atoms/Spinner/Spinner';
import CurrencySelect from '../../molecules/CurrencySelect/CurrencySelect';
import TabButton from '../../molecules/TabButton/TabButton';
import TaskCard from '../../molecules/TaskCard/TaskCard';
import EditModal from '../../organisms/EditModal/EditModal';
import { Pencil, Trash2, Folder, Sparkles, FolderOpen, Blocks, Clock, ChevronDown, ChevronRight, Paperclip, Loader, X, Download, Briefcase, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../utils/supabaseClient';
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
  fetchProjectAttachments,
  addProjectAttachment,
  deleteProjectAttachment,
  updateProjectAttachment,
  reorderCategories,
  reorderProjects,
  reorderTasks,
} from '../../../api';
import { CURRENCY_SYMBOLS } from '../../../utils/currency';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './TaskManagerBoard.css';

function SortableCategory({ category, activeTab, setActiveTab }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `cat-${category.id}` });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TabButton
        className={`tab-btn ${activeTab === category.name.toLowerCase() ? 'active-loco' : ''}`}
        isActive={activeTab === category.name.toLowerCase()}
        onClick={() => setActiveTab(category.name.toLowerCase())}
      >
        {category.name}
      </TabButton>
    </div>
  );
}

function SortableWrapper({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return children({ setNodeRef, style, attributes, listeners });
}

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

  const [selectedCategoryToManage, setSelectedCategoryToManage] = useState('');
  const [isCategoryNameFocused, setIsCategoryNameFocused] = useState(false);
  const [collapsedProjects, setCollapsedProjects] = useState(new Set());

  const [attachmentsByProject, setAttachmentsByProject] = useState({});
  const [uploadingToProject, setUploadingToProject] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEndCategory = async (event) => {
    const { active, over } = event;
    if (active.id !== over?.id && over != null) {
      const oldIndex = categories.findIndex(c => `cat-${c.id}` === active.id);
      const newIndex = categories.findIndex(c => `cat-${c.id}` === over.id);
      const newCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(newCategories);
      const orderData = newCategories.map((c, i) => ({ id: c.id, sort_order: i }));
      await reorderCategories(orderData);
    }
  };

  const handleDragEndProject = async (event) => {
    const { active, over } = event;
    if (active.id !== over?.id && over != null) {
      const oldIndex = projects.findIndex(p => `proj-${p.id}` === active.id);
      const newIndex = projects.findIndex(p => `proj-${p.id}` === over.id);
      const newProjects = arrayMove(projects, oldIndex, newIndex);
      setProjects(newProjects);
      const orderData = newProjects.map((p, i) => ({ id: p.id, sort_order: i }));
      await reorderProjects(orderData);
    }
  };

  const handleDragEndTask = async (event) => {
    const { active, over } = event;
    if (active.id !== over?.id && over != null) {
      const oldIndex = tasks.findIndex(t => `task-${t.id}` === active.id);
      const newIndex = tasks.findIndex(t => `task-${t.id}` === over.id);
      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(newTasks);
      const orderData = newTasks.map((t, i) => ({ id: t.id, sort_order: i }));
      await reorderTasks(orderData);
      if (onTaskChange) onTaskChange();
    }
  };

  const handleDragEnd = async (event) => {
    const { active } = event;
    if (!active) return;
    const idStr = String(active.id);
    if (idStr.startsWith('cat-')) await handleDragEndCategory(event);
    else if (idStr.startsWith('proj-')) await handleDragEndProject(event);
    else if (idStr.startsWith('task-')) await handleDragEndTask(event);
  };

  const [editingProject, setEditingProject] = useState(null);
  const [editProjectForm, setEditProjectForm] = useState({ name: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({ name: '', hourly_rate: 0, budgeted_hours: '', color: '#10b981' });
  const [isBudgetFocused, setIsBudgetFocused] = useState(false);

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

        const attachMap = {};
        await Promise.all(safeProjects.map(async p => {
          try {
            attachMap[p.id] = await fetchProjectAttachments(p.id) || [];
          } catch (e) {
            attachMap[p.id] = [];
          }
        }));
        setAttachmentsByProject(attachMap);

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
        color: '#10b981',
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
      budgeted_hours: task.budgeted_hours !== null && task.budgeted_hours !== undefined ? task.budgeted_hours : '',
      color: task.color || '#10b981'
    });
  };

  const handleSaveTask = async () => {
    try {
      if (!editingTask || !editTaskForm.name.trim()) return;
      const updated = await updateTask(editingTask.id, {
        name: editTaskForm.name.trim(),
        color: editTaskForm.color,
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

  const handleFileUpload = async (projectId, file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      window.alert(`O arquivo excedeu 10MB!`);
      return;
    }
    setUploadingToProject(projectId);
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage.from('project-attachments').upload(fileName, file);
      if (error) throw error;

      const { data: publicData } = supabase.storage.from('project-attachments').getPublicUrl(fileName);

      const created = await addProjectAttachment(projectId, {
        file_name: file.name,
        file_url: publicData.publicUrl,
        file_size: file.size
      });
      setAttachmentsByProject(prev => ({
        ...prev,
        [projectId]: [...(prev[projectId] || []), created]
      }));
    } catch (e) {
      window.alert(`Erro no upload: ${e.message}`);
    } finally {
      setUploadingToProject(null);
    }
  };

  const handleDeleteAttachment = async (projectId, attachment) => {
    if (!window.confirm(`Tem certeza que deseja apagar o anexo ${attachment.file_name}?`)) return;
    try {
      await deleteProjectAttachment(attachment.id);
      setAttachmentsByProject(prev => ({
        ...prev,
        [projectId]: (prev[projectId] || []).filter(a => a.id !== attachment.id)
      }));
      // Note: Opcionalmente deletaríamos fisicamente do Supabase, mas no plano grátis podemos acumular.
    } catch (e) {
      window.alert(`Erro ao deletar anexo: ${e.message}`);
    }
  };

  const handleUpdateAttachmentColor = async (projectId, attachment, newColor) => {
    try {
      const updated = await updateProjectAttachment(projectId, attachment.id, { color: newColor });
      setAttachmentsByProject(prev => ({
        ...prev,
        [projectId]: (prev[projectId] || []).map(a => a.id === attachment.id ? updated : a)
      }));
    } catch (e) {
      console.error(`Erro ao atualizar cor do anexo: ${e.message}`);
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
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="task-manager fade-in">
        <div className="task-manager-header">
          <h2 className="task-manager-title gradient-text"><Blocks size={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} strokeWidth={1.5} /> Gerenciar Projetos e Tasks</h2>
        </div>

        <div className="forms-grid">
          <form className="task-form glass-card-static" onSubmit={handleCreateCategory}>
            <div className="task-form-title"><Briefcase size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} strokeWidth={1.5} /> Nova Categoria</div>
            <div className="task-form-field">
              <label className="task-form-label">Nome</label>
              <Input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                required
                placeholder="Ex.: Trabalho, Freelance, Pessoal..."
                onFocus={(e) => { e.target.placeholder = ''; setIsCategoryNameFocused(true); }}
                onBlur={(e) => { e.target.placeholder = 'Ex.: Trabalho, Freelance, Pessoal...'; setIsCategoryNameFocused(false); }}
              />
            </div>
            <div className="task-form-field task-form-spacing" style={{ marginBottom: 'var(--space-6)' }}>
              <label className="task-form-label">Gerenciar Categoria</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Select
                  value={selectedCategoryToManage}
                  onChange={(e) => setSelectedCategoryToManage(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">Selecionar categoria...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>

                {selectedCategoryToManage && categories.find((c) => String(c.id) === selectedCategoryToManage) && (
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn btn-icon"
                      style={{ background: 'rgba(255,255,255,0.05)', padding: '8px' }}
                      onClick={() => {
                        const cat = categories.find((c) => String(c.id) === selectedCategoryToManage);
                        if (cat) handleEditCategory(cat);
                      }}
                      title="Editar categoria"
                    >
                      <Pencil size={16} strokeWidth={1.5} style={{ color: 'var(--color-info)' }} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon"
                      style={{ background: 'rgba(255,255,255,0.05)', padding: '8px' }}
                      onClick={() => {
                        const cat = categories.find((c) => String(c.id) === selectedCategoryToManage);
                        if (cat) {
                          handleDeleteCategory(cat);
                          setSelectedCategoryToManage('');
                        }
                      }}
                      title="Excluir categoria"
                    >
                      <Trash2 size={16} strokeWidth={1.5} style={{ color: 'var(--color-danger)' }} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button type="submit" className="btn btn-primary task-form-submit">+ Criar Categoria</button>
          </form>

          <form className="task-form glass-card-static" onSubmit={handleCreateProject}>
            <div className="task-form-title"><FolderOpen size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} strokeWidth={1.5} /> Novo Projeto</div>
            <div className="task-form-field">
              <label className="task-form-label">💼 Nome do Projeto</label>
              <Input value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} required />
            </div>
            <div className="task-form-field task-form-spacing" style={{ marginBottom: 'var(--space-6)' }}>
              <label className="task-form-label">🏷️ Categoria</label>
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
              <label className="task-form-label">✨ Nome da Task</label>
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
            <div className="task-form-inline-row" style={{ marginBottom: 'var(--space-6)' }}>
              <div className="task-form-field task-form-currency-field">
                <label className="task-form-label">Moeda</label>
                <CurrencySelect value={newTaskCurrency} onChange={(event) => setNewTaskCurrency(event.target.value)} />
              </div>
              <div className="task-form-field task-form-inline-field">
                <label className="task-form-label">Valor/Hora</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newTaskHourlyRate}
                  onChange={(event) => setNewTaskHourlyRate(event.target.value)}
                  placeholder={`${CURRENCY_SYMBOLS[newTaskCurrency] || '$'}`}
                  onFocus={(e) => e.target.placeholder = ''}
                  onBlur={(e) => e.target.placeholder = `${CURRENCY_SYMBOLS[newTaskCurrency] || '$'}`}
                />
              </div>
              <div className="task-form-field task-form-inline-field">
                <label className="task-form-label">Horas Orçadas</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={newTaskBudgetedHours}
                    onChange={(event) => setNewTaskBudgetedHours(event.target.value)}
                    placeholder=""
                    onFocus={() => setIsBudgetFocused(true)}
                    onBlur={() => setIsBudgetFocused(false)}
                  />
                  {!newTaskBudgetedHours && !isBudgetFocused && (
                    <Clock size={16} strokeWidth={1.5} style={{ position: 'absolute', left: 'var(--space-3)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  )}
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary task-form-submit" disabled={creatingTask}>+ Criar Task</button>
          </form>
        </div>

        <div className="category-tabs-scroll" style={{ marginBottom: 'var(--space-4)' }}>
          <SortableContext items={categories.map(c => `cat-${c.id}`)} strategy={horizontalListSortingStrategy}>
            <div className="category-tabs">
              {categories.map((category) => (
                <SortableCategory key={category.id} category={category} activeTab={activeTab} setActiveTab={setActiveTab} />
              ))}
            </div>
          </SortableContext>
        </div>

        <SortableContext items={categoryProjects.map(p => `proj-${p.id}`)} strategy={verticalListSortingStrategy}>
          <div className="projects-grid">
            {categoryProjects.length === 0 ? <p className="empty-msg">Nenhum projeto encontrado.</p> : null}
            {categoryProjects.map((project) => {
              const projectTasks = tasks.filter((task) => task.project_id === project.id);
              return (
                <SortableWrapper key={project.id} id={`proj-${project.id}`}>
                  {({ setNodeRef, style, attributes, listeners }) => (
                    <div ref={setNodeRef} style={{ ...style, position: 'relative' }} className="project-folder">
                      <div
                        className="project-folder-tab"
                        {...attributes} {...listeners}
                        onClick={() => {
                          setCollapsedProjects(prev => {
                            const next = new Set(prev);
                            if (next.has(project.id)) next.delete(project.id);
                            else next.add(project.id);
                            return next;
                          });
                        }}
                        style={{ cursor: 'pointer' }}
                        title={collapsedProjects.has(project.id) ? "Expandir projeto" : "Minimizar projeto"}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            className="btn-icon"
                            title={collapsedProjects.has(project.id) ? "Expandir projeto" : "Minimizar projeto"}
                          >
                            {collapsedProjects.has(project.id) ? <ChevronRight size={18} strokeWidth={1.5} /> : <ChevronDown size={18} strokeWidth={1.5} />}
                          </button>
                          <Folder size={16} strokeWidth={1.5} /> {project.name}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <label className="btn-icon" title="Anexar arquivo na nuvem" onClick={e => e.stopPropagation()} style={{ cursor: 'pointer', opacity: uploadingToProject === project.id ? 0.5 : 1 }}>
                            {uploadingToProject === project.id ? <Loader size={16} strokeWidth={1.5} className="spin-animation" /> : <Paperclip size={16} strokeWidth={1.5} />}
                            <input type="file" hidden accept=".svg,.png,.jpg,.jpeg,.gif,.pdf,.zip,.rar,.doc,.docx,.xls,.xlsx,.json,.fig" onChange={(e) => {
                              const file = e.target.files[0];
                              e.target.value = null; // reseta pra conseguir mandar o mesmo
                              handleFileUpload(project.id, file);
                            }} disabled={uploadingToProject === project.id} />
                          </label>
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
                      {!collapsedProjects.has(project.id) && (
                        <div className="project-folder-body glass-card">

                          <SortableContext items={projectTasks.map(t => `task-${t.id}`)} strategy={verticalListSortingStrategy}>
                            <div className="task-cards-list" style={{ marginBottom: (attachmentsByProject[project.id] && attachmentsByProject[project.id].length > 0) ? 'var(--space-6)' : 0 }}>
                              {projectTasks.map((task) => (
                                <SortableWrapper key={task.id} id={`task-${task.id}`}>
                                  {({ setNodeRef, style, attributes, listeners }) => (
                                    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
                                      <TaskCard
                                        variant="manager"
                                        task={task}
                                        currencySymbol={CURRENCY_SYMBOLS[task.currency || 'EUR']}
                                        onToggleBilled={toggleBilled}
                                        onDelete={handleDeleteTask}
                                        onEdit={handleEditTaskClick}
                                      />
                                    </div>
                                  )}
                                </SortableWrapper>
                              ))}
                              {projectTasks.length === 0 ? <span className="empty-msg task-list-empty">Sem tasks neste projeto.</span> : null}
                            </div>
                          </SortableContext>

                          {attachmentsByProject[project.id] && attachmentsByProject[project.id].length > 0 && (
                            <div className="attachments-section">
                              <div style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                                <FolderOpen size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} strokeWidth={1.5} />
                                Arquivos do projeto
                              </div>
                              <div className="attachments-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)', padding: '0 var(--space-2)' }}>
                                {attachmentsByProject[project.id].map(att => (
                                  <div key={att.id} style={{ position: 'relative', overflow: 'hidden', paddingLeft: '14px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3) var(--space-2) 18px', fontSize: 'var(--text-xs)' }}>
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: att.color || 'var(--border-subtle)' }} />

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <label title="Vincular cor da task" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                        <input
                                          type="color"
                                          style={{ width: '16px', height: '16px', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }}
                                          value={att.color || '#4a5568'}
                                          onChange={(e) => handleUpdateAttachmentColor(project.id, att, e.target.value)}
                                        />
                                      </label>
                                    </div>

                                    <span className="truncate" style={{ flex: 1, fontWeight: 500, color: 'var(--text-primary)' }} title={att.file_name}>{att.file_name}</span>

                                    <div style={{ display: 'flex', gap: '4px' }}>
                                      <a href={att.file_url} target="_blank" rel="noreferrer" className="btn-icon" style={{ padding: '6px' }} title="Baixar">
                                        <Download size={14} style={{ color: 'var(--color-primary)' }} strokeWidth={1.5} />
                                      </a>
                                      <button type="button" onClick={() => handleDeleteAttachment(project.id, att)} className="btn-icon" style={{ padding: '6px' }} title="Excluir">
                                        <X size={14} style={{ color: 'var(--color-danger)' }} strokeWidth={1.5} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </SortableWrapper>
              );
            })}
          </div>
        </SortableContext>

        <EditModal isOpen={!!editingProject} title="Editar Projeto" onClose={() => setEditingProject(null)} onSave={handleSaveProject}>
          <div className="edit-modal-field">
            <label className="edit-modal-label">Nome do Projeto</label>
            <Input value={editProjectForm.name} onChange={e => setEditProjectForm({ ...editProjectForm, name: e.target.value })} required />
          </div>
        </EditModal>

        <EditModal isOpen={!!editingTask} title="Editar Tarefa" onClose={() => setEditingTask(null)} onSave={handleSaveTask}>
          <div className="edit-modal-field">
            <label className="edit-modal-label">✨ Nome da Tarefa</label>
            <Input value={editTaskForm.name} onChange={e => setEditTaskForm({ ...editTaskForm, name: e.target.value })} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', alignItems: 'end' }}>
            <div className="edit-modal-field">
              <label className="edit-modal-label">Valor / Hora</label>
              <Input type="number" step="0.01" value={editTaskForm.hourly_rate} onChange={e => setEditTaskForm({ ...editTaskForm, hourly_rate: e.target.value })} />
            </div>
            <div className="edit-modal-field">
              <label className="edit-modal-label">Horas Orçadas</label>
              <Input type="number" step="0.1" value={editTaskForm.budgeted_hours} onChange={e => setEditTaskForm({ ...editTaskForm, budgeted_hours: e.target.value })} />
            </div>
            <div className="edit-modal-field">
              <label className="edit-modal-label">Cor</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" className="color-picker" value={editTaskForm.color || '#10b981'} onChange={e => setEditTaskForm({ ...editTaskForm, color: e.target.value })} style={{ width: '42px', height: '42px', padding: '0', cursor: 'pointer', borderRadius: '4px' }} />
                <button type="button" onClick={() => navigator.clipboard.writeText(editTaskForm.color || '#10b981')} className="btn-icon" style={{ padding: '6px', opacity: 0.7 }} title="Copiar código HEX">
                  <Copy size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </EditModal>

      </div >
    </DndContext>
  );
}
