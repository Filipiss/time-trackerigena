import { useEffect, useMemo, useState } from 'react';
import Spinner from '../../atoms/Spinner/Spinner';
import TabButton from '../../molecules/TabButton/TabButton';
import TaskCard from '../../molecules/TaskCard/TaskCard';
import { fetchProjects, fetchTasks } from '../../../api';
import './TaskSelectorPanel.css';

const CATEGORY_LABELS = {
  loco: 'Loco',
  freelas: 'Freelas',
};

export default function TaskSelectorPanel({ selectedTask, onSelectTask, refreshTrigger }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        if (active) {
          setLoading(true);
        }
        const [projectData, taskData] = await Promise.all([fetchProjects(), fetchTasks()]);
        if (!active) return;
        const validProjects = projectData || [];
        const validTasks = taskData || [];
        setProjects(validProjects);
        setTasks(validTasks);

        // Se uma task estava selecionada, verifica se ela ainda existe no backend. 
        // Se foi excluída, limpa a seleção.
        if (selectedTask && !validTasks.some(t => String(t.id) === String(selectedTask.id))) {
          onSelectTask(null);
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
  }, [refreshTrigger]);

  const categories = useMemo(() => {
    const values = new Set(projects.map((project) => project.category));
    return Array.from(values).filter(Boolean);
  }, [projects]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedTask?.project_id) || null,
    [projects, selectedTask],
  );

  const effectiveCategory = activeCategory ?? selectedProject?.category ?? categories[0] ?? null;
  const projectsInCategory = useMemo(
    () => projects.filter((project) => project.category === effectiveCategory),
    [effectiveCategory, projects],
  );

  const effectiveProjectId =
    activeProjectId ??
    (selectedProject && selectedProject.category === effectiveCategory ? selectedProject.id : null) ??
    projectsInCategory[0]?.id ??
    null;

  const tasksInProject = useMemo(
    () => tasks.filter((task) => task.project_id === effectiveProjectId),
    [effectiveProjectId, tasks],
  );

  const handleSelectCategory = (category) => {
    setActiveCategory(category);
    setActiveProjectId(null);
  };

  if (loading) {
    return (
      <div className="task-selector glass-card-static task-selector-shell">
        <div className="task-selector-loading">
          <Spinner label="Carregando..." />
        </div>
      </div>
    );
  }

  return (
    <div className="task-selector glass-card-static task-selector-shell">
      <div className="task-selector-header">
        <h3 className="task-selector-title">📋 Filtro de Cronometragem</h3>
      </div>

      {projects.length === 0 ? (
        <div className="task-selector-empty">
          <p>Nenhum projeto encontrado. Crie projetos e tasks na aba Tasks!</p>
        </div>
      ) : (
        <>
          <div className="selector-filter-group">
            <div className="selector-filter-label">Categoria</div>
            <div className="selector-tabs-scroll">
              <div className="selector-tabs">
                {categories.map((category) => (
                  <TabButton
                    key={category}
                    className={`selector-tab ${effectiveCategory === category ? 'active' : ''}`}
                    isActive={effectiveCategory === category}
                    dotColor={`var(--color-${category})`}
                    onClick={() => handleSelectCategory(category)}
                    style={
                      effectiveCategory === category
                        ? { borderColor: `var(--color-${category})`, color: `var(--color-${category})` }
                        : undefined
                    }
                  >
                    {CATEGORY_LABELS[category] || category}
                  </TabButton>
                ))}
              </div>
            </div>
          </div>

          <div className="selector-filter-group">
            <div className="selector-filter-label">Projeto</div>
            {projectsInCategory.length === 0 ? (
              <div className="task-selector-empty selector-inline-empty">
                <p>Nenhum projeto nesta categoria.</p>
              </div>
            ) : (
              <div className="selector-tabs-scroll">
                <div className="selector-tabs">
                  {projectsInCategory.map((project) => (
                    <TabButton
                      key={project.id}
                      className={`selector-tab ${effectiveProjectId === project.id ? 'active' : ''}`}
                      isActive={effectiveProjectId === project.id}
                      onClick={() => setActiveProjectId(project.id)}
                    >
                      📁 {project.name}
                    </TabButton>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="selector-filter-group">
            <div className="selector-filter-label">Task</div>
            {tasksInProject.length === 0 ? (
              <div className="task-selector-empty selector-inline-empty">
                <p>Nenhuma task neste projeto. Crie tasks na aba Tasks!</p>
              </div>
            ) : (
              <div className="task-selector-grid">
                {tasksInProject.map((task) => (
                  <TaskCard key={task.id} task={task} selected={selectedTask?.id === task.id} onClick={onSelectTask} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
