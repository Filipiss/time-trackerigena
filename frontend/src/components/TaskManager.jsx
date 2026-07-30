import { useState, useEffect, useCallback } from 'react';
import { fetchProjects, createProject, deleteProject, fetchTasks, createTask, updateTask, deleteTask, fetchCategories, createCategory, updateCategory, deleteCategory } from '../api';
import './TaskManager.css';

export default function TaskManager({ onTaskChange, onNavigateToHistory }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(true);

  // Forms
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('loco');
  const [creatingProject, setCreatingProject] = useState(false);

  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTaskColor, setNewTaskColor] = useState('#10b981');
  const [newTaskHourlyRate, setNewTaskHourlyRate] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  const [activeTab, setActiveTab] = useState('loco'); // 'loco' ou 'freelas'

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [projData, taskData, categoryData] = await Promise.all([
        fetchProjects(),
        fetchTasks(),
        fetchCategories()
      ]);
      setProjects(projData || []);
      setTasks(taskData || []);
      setCategories(categoryData || []);
      setActiveTab(current => categoryData?.some(category => category.name.toLowerCase() === current) ? current : (categoryData?.[0]?.name.toLowerCase() || ''));
      if (projData && projData.length > 0 && !newTaskProjectId) {
        setNewTaskProjectId(projData[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [newTaskProjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    try {
      const proj = await createProject({ name: newProjectName.trim(), category: newProjectCategory });
      setProjects(prev => [...prev, proj]);
      setNewProjectName('');
      if (!newTaskProjectId) setNewTaskProjectId(proj.id);
    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const category = await createCategory(newCategoryName.trim());
      setCategories(previous => [...previous, category]);
      setNewCategoryName('');
      setNewProjectCategory(category.name);
      setActiveTab(category.name.toLowerCase());
    } catch (error) { alert('Erro: ' + error.message); }
  };

  const handleEditCategory = async (category) => {
    const name = window.prompt('Novo nome da categoria:', category.name);
    if (!name?.trim() || name.trim() === category.name) return;
    try {
      const updated = await updateCategory(category.id, name.trim());
      setCategories(previous => previous.map(item => item.id === updated.id ? updated : item));
      setProjects(previous => previous.map(project => project.category === category.name ? { ...project, category: updated.name.toLowerCase() } : project));
      setActiveTab(current => current === category.name.toLowerCase() ? updated.name.toLowerCase() : current);
    } catch (error) { alert('Erro: ' + error.message); }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Excluir a categoria "${category.name}"? Ela precisa estar sem projetos.`)) return;
    try {
      await deleteCategory(category.id);
      setCategories(previous => previous.filter(item => item.id !== category.id));
      setActiveTab(current => current === category.name.toLowerCase() ? '' : current);
    } catch (error) { alert('Erro: ' + error.message); }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskName.trim() || !newTaskProjectId) return;
    setCreatingTask(true);
    try {
      const task = await createTask({
        name: newTaskName.trim(),
        project_id: parseInt(newTaskProjectId),
        color: newTaskColor,
        hourly_rate: parseFloat(newTaskHourlyRate) || 0.0,
        is_billed: false
      });
      setTasks(prev => [...prev, task]);
      setNewTaskName('');
      setNewTaskHourlyRate('');
      if (onTaskChange) onTaskChange();
    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setCreatingTask(false);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      if (onTaskChange) onTaskChange();
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };
  
  const handleDeleteProject = async (id) => {
    if (!window.confirm("Isso apagará o projeto e todas as tasks/tempos associados. Continuar?")) return;
    try {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setTasks(prev => prev.filter(t => t.project_id !== id));
      if (onTaskChange) onTaskChange();
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  const toggleBilled = async (task) => {
    try {
      const updated = await updateTask(task.id, { is_billed: !task.is_billed });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_billed: updated.is_billed } : t));
      if (onTaskChange) onTaskChange();
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading-spinner" />;
  }

  const categoryProjects = projects.filter(p => p.category === activeTab);

  return (
    <div className="task-manager fade-in">
      <div className="task-manager-header">
        <h2 className="task-manager-title gradient-text">📋 Gerenciar Projetos e Tasks</h2>
      </div>

      <div className="forms-grid">
        <form className="task-form glass-card-static" onSubmit={handleCreateCategory}>
          <div className="task-form-title">Nova Categoria</div>
          <div className="task-form-field">
            <label className="task-form-label">Nome</label>
            <input className="input" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{marginTop: '15px'}}>+ Criar Categoria</button>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '15px'}}>
            {categories.map(category => <span key={category.id} className="badge" style={{display: 'inline-flex', gap: '4px', alignItems: 'center'}}>{category.name}<button type="button" className="btn-icon" onClick={() => handleEditCategory(category)} title="Editar categoria">✏️</button><button type="button" className="btn-icon" onClick={() => handleDeleteCategory(category)} title="Excluir categoria" style={{color: 'var(--color-danger)'}}>🗑️</button></span>)}
          </div>
        </form>
        <form className="task-form glass-card-static" onSubmit={handleCreateProject}>
          <div className="task-form-title">📁 Novo Projeto</div>
          <div className="task-form-field">
            <label className="task-form-label">Nome do Projeto</label>
            <input className="input" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} required />
          </div>
          <div className="task-form-field" style={{marginTop: '10px'}}>
            <label className="task-form-label">Categoria</label>
            <select className="input" value={newProjectCategory} onChange={e => setNewProjectCategory(e.target.value)} required>
              {categories.map(category => <option key={category.id} value={category.name}>{category.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{marginTop: '15px'}} disabled={creatingProject}>+ Criar Projeto</button>
        </form>

        <form className="task-form glass-card-static" onSubmit={handleCreateTask}>
          <div className="task-form-title">✨ Nova Task</div>
          <div className="task-form-field">
            <label className="task-form-label">Nome da Task</label>
            <input className="input" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} required />
          </div>
          <div className="task-form-field" style={{marginTop: '10px'}}>
            <label className="task-form-label">Projeto</label>
            <select className="input" value={newTaskProjectId} onChange={e => setNewTaskProjectId(e.target.value)} required>
              <option value="">Selecione um projeto...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>[{p.category}] {p.name}</option>
              ))}
            </select>
          </div>
          <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
             <div className="task-form-field" style={{flex: 1}}>
                <label className="task-form-label">Valor/Hora (€)</label>
                <input className="input" type="number" step="0.01" value={newTaskHourlyRate} onChange={e => setNewTaskHourlyRate(e.target.value)} placeholder="Opcional" />
             </div>
             <div className="task-form-field">
                <label className="task-form-label">Cor</label>
                <input type="color" className="color-picker" value={newTaskColor} onChange={e => setNewTaskColor(e.target.value)} />
             </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{marginTop: '15px'}} disabled={creatingTask}>+ Criar Task</button>
        </form>
      </div>

      <div className="category-tabs">
        {categories.map(category => <button key={category.id} className={`tab-btn ${activeTab === category.name.toLowerCase() ? 'active-loco' : ''}`} onClick={() => setActiveTab(category.name.toLowerCase())}>{category.name}</button>)}
      </div>

      <div className="projects-grid">
        {categoryProjects.length === 0 ? <p className="empty-msg">Nenhum projeto encontrado.</p> : null}
        {categoryProjects.map(proj => {
          const projTasks = tasks.filter(t => t.project_id === proj.id);
          return (
            <div key={proj.id} className="project-folder">
              <div className="project-folder-tab" onClick={() => onNavigateToHistory && onNavigateToHistory('faturamento')} title="Ver Faturamento deste projeto">
                <span>📁 {proj.name}</span>
                <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj.id); }} style={{color: 'var(--color-danger)'}} title="Excluir Projeto">🗑️</button>
              </div>
              <div className="project-folder-body glass-card">
                <div className="task-cards-list">
                  {projTasks.map(task => (
                    <div key={task.id} className={`task-card glass-card ${task.is_billed ? 'task-card-billed' : ''}`}>
                      <span className="task-card-color" style={{ backgroundColor: task.color || '#06b6d4' }} />
                      <div className="task-card-info">
                        <div className="task-card-name truncate">{task.name}</div>
                        <div className="task-card-meta">
                          <span className="task-hourly-rate-badge font-mono">€ {(task.hourly_rate || 0).toFixed(2)}/h</span>
                          {task.is_billed && <span className="badge badge-success billed-badge">Cobrado ✓</span>}
                        </div>
                      </div>
                      <div className="task-card-actions">
                        <button className={`btn-billed-toggle ${task.is_billed ? 'active' : ''}`} onClick={() => toggleBilled(task)} title={task.is_billed ? "Desmarcar como Cobrado" : "Marcar como Cobrado"}>{task.is_billed ? '💶' : '💵'}</button>
                        <button className="btn-icon" onClick={() => handleDeleteTask(task.id)} style={{ color: 'var(--color-danger)' }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                  {projTasks.length === 0 && <span className="empty-msg" style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>Sem tasks neste projeto.</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
