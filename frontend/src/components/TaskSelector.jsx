import { useState, useEffect, useCallback } from 'react';
import { fetchProjects, fetchTasks, createTask } from '../api';
import './TaskSelector.css';

export default function TaskSelector({ selectedTask, onSelectTask, refreshTrigger }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuickCreate, setShowQuickCreate] = useState(null); // projectId
  const [newTaskName, setNewTaskName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [projData, taskData] = await Promise.all([fetchProjects(), fetchTasks()]);
      setProjects(projData || []);
      setTasks(taskData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  const handleQuickCreate = async (projectId, category) => {
    if (!newTaskName.trim()) return;

    setCreating(true);
    try {
      const newTask = await createTask({
        name: newTaskName.trim(),
        project_id: projectId,
        color: category === 'loco' ? '#10b981' : '#f59e0b',
        hourly_rate: 0.0,
      });

      setTasks(prev => [...prev, newTask]);
      setNewTaskName('');
      setShowQuickCreate(null);
    } catch (error) {
      alert('Erro ao criar task: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="task-selector glass-card-static" style={{ padding: 'var(--space-6)' }}>
        <div className="task-selector-loading">
          <div className="loading-spinner" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  const locoProjects = projects.filter(p => p.category === 'loco');
  const freelasProjects = projects.filter(p => p.category === 'freelas');

  const renderProject = (proj) => {
    const projTasks = tasks.filter(t => t.project_id === proj.id);
    return (
      <div key={proj.id} className="selector-project-block" style={{marginTop: '15px', paddingLeft: '10px', borderLeft: '2px solid rgba(255,255,255,0.05)'}}>
        <div className="selector-project-name" style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold'}}>
           📁 {proj.name}
        </div>
        <div className="task-selector-grid">
          {projTasks.map(task => (
            <button
              key={task.id}
              className={`task-selector-item ${selectedTask?.id === task.id ? 'selected' : ''}`}
              onClick={() => onSelectTask(task)}
            >
              <span className="task-dot" style={{ backgroundColor: task.color || 'var(--color-primary)' }} />
              <span className="task-item-name">{task.name}</span>
            </button>
          ))}
        </div>
        {showQuickCreate === proj.id ? (
          <div className="quick-create-form" style={{marginTop: '10px'}}>
            <input className="input" type="text" placeholder="Nome da task..." value={newTaskName} onChange={e => setNewTaskName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleQuickCreate(proj.id, proj.category)} autoFocus />
            <button className={`btn ${proj.category === 'loco' ? 'btn-success' : 'btn-warning'}`} onClick={() => handleQuickCreate(proj.id, proj.category)} disabled={creating || !newTaskName.trim()}>{creating ? '...' : '✓'}</button>
            <button className="btn btn-ghost" onClick={() => { setShowQuickCreate(null); setNewTaskName(''); }}>✕</button>
          </div>
        ) : (
          <button className="task-selector-add-btn" onClick={() => setShowQuickCreate(proj.id)} style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}>
            + Nova Task em {proj.name}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="task-selector glass-card-static" style={{ padding: 'var(--space-6)' }}>
      <div className="task-selector-header">
        <h3 className="task-selector-title">📋 Selecione a Task</h3>
      </div>

      {projects.length === 0 ? (
        <div className="task-selector-empty">
          <p>Nenhum projeto encontrado. Crie projetos e tasks na aba Tasks!</p>
        </div>
      ) : (
        <>
          {locoProjects.length > 0 && (
            <div className="task-group">
              <div className="task-group-header" style={{borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '5px'}}>
                <span className="task-group-dot" style={{ backgroundColor: 'var(--color-loco)' }} />
                <span className="task-group-name" style={{ color: 'var(--color-loco)' }}>Loco</span>
              </div>
              {locoProjects.map(renderProject)}
            </div>
          )}

          {freelasProjects.length > 0 && (
            <div className="task-group" style={{marginTop: '25px'}}>
              <div className="task-group-header" style={{borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '5px'}}>
                <span className="task-group-dot" style={{ backgroundColor: 'var(--color-freelas)' }} />
                <span className="task-group-name" style={{ color: 'var(--color-freelas)' }}>Freelas</span>
              </div>
              {freelasProjects.map(renderProject)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
