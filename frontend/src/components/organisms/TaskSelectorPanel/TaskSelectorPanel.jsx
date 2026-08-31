import { useEffect, useMemo, useState } from 'react';
import Spinner from '../../atoms/Spinner/Spinner';
import TabButton from '../../molecules/TabButton/TabButton';
import TaskCard from '../../molecules/TaskCard/TaskCard';
import { Folder, Briefcase } from 'lucide-react';
import { fetchProjects, fetchTasks } from '../../../api';
import { useLanguage } from '../../../contexts/LanguageContext';
import './TaskSelectorPanel.css';

export default function TaskSelectorPanel({ selectedTask, onSelectTask, refreshTrigger }) {
  const { t } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);

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

  const visibleCategories = useMemo(() => {
    return showAllCategories ? categories : categories.slice(0, 5);
  }, [categories, showAllCategories]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedTask?.project_id) || null,
    [projects, selectedTask],
  );

  const effectiveCategory = activeCategory ?? selectedProject?.category ?? categories[0] ?? null;
  const projectsInCategory = useMemo(
    () => projects.filter((project) => project.category === effectiveCategory),
    [effectiveCategory, projects],
  );

  const visibleProjects = useMemo(() => {
    return showAllProjects ? projectsInCategory : projectsInCategory.slice(0, 5);
  }, [projectsInCategory, showAllProjects]);

  const effectiveProjectId =
    activeProjectId ??
    (selectedProject && selectedProject.category === effectiveCategory ? selectedProject.id : null) ??
    projectsInCategory[0]?.id ??
    null;

  const tasksInProject = useMemo(
    () => tasks.filter((task) => task.project_id === effectiveProjectId),
    [effectiveProjectId, tasks],
  );

  const visibleTasks = useMemo(() => {
    return showAllTasks ? tasksInProject : tasksInProject.slice(0, 5);
  }, [tasksInProject, showAllTasks]);

  const handleSelectCategory = (category) => {
    setActiveCategory(category);
    setActiveProjectId(null);
    setShowAllProjects(false);
    setShowAllTasks(false);
  };

  if (loading) {
    return (
      <div className="task-selector o-card--static c-selector">
        <div className="task-selector-loading">
          <Spinner label={t("Carregando...")} />
        </div>
      </div>
    );
  }

  return (
    <div className="task-selector o-card--static c-selector">
      <div className="task-selector-header">
        <h3 className="c-selector__title">{t("Opções do Timer")}</h3>
      </div>

      {projects.length === 0 ? (
        <div className="task-selector-empty">
          <p>{t("Nenhum projeto encontrado. Vá para a página de tarefas para criar um.")}</p>
        </div>
      ) : (
        <>
          <div className="c-selector__filters">
            <div className="selector-filter-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Briefcase size={14} strokeWidth={1.5} /> {t("Categoria")}
            </div>
            <div className="c-selector__tabs-scroll">
              <div className="c-selector__tabs">
                {visibleCategories.map((category) => (
                  <TabButton
                    key={category}
                    className="c-selector__tab"
                    isActive={effectiveCategory === category}
                    dotColor={`var(--color-${category})`}
                    onClick={() => handleSelectCategory(category)}
                    style={
                      effectiveCategory === category
                        ? { borderColor: `var(--color-${category})`, color: `var(--color-${category})` }
                        : undefined
                    }
                    icon={<Briefcase size={14} strokeWidth={1.5} />}
                  >
                    {category}
                  </TabButton>
                ))}
              </div>
            </div>
            {categories.length > 5 && (
              <button
                type="button"
                className="c-selector__toggle-btn"
                onClick={() => setShowAllCategories(p => !p)}
              >
                {showAllCategories ? t("Recolher") : t("Mostrar tudo")}
              </button>
            )}
          </div>

          <div className="c-selector__filters">
            <div className="selector-filter-label">{t("Projeto")}</div>
            {projectsInCategory.length === 0 ? (
              <div className="task-selector-empty selector-inline-empty">
                <p>{t("Nenhum projeto nesta categoria.")}</p>
              </div>
            ) : (
              <>
                <div className="c-selector__tabs-scroll">
                  <div className="c-selector__tabs">
                    {visibleProjects.map((project) => (
                      <TabButton
                        key={project.id}
                        className={`c-selector__tab ${effectiveProjectId === project.id ? 'is-active' : ''}`}
                        isActive={effectiveProjectId === project.id}
                        onClick={() => {
                          setActiveProjectId(project.id);
                          setShowAllTasks(false);
                        }}
                      >
                        <Folder size={14} style={{ marginRight: '6px' }} strokeWidth={1.5} /> {project.name}
                      </TabButton>
                    ))}
                  </div>
                </div>
                {projectsInCategory.length > 5 && (
                  <button
                    type="button"
                    className="c-selector__toggle-btn"
                    onClick={() => setShowAllProjects(p => !p)}
                  >
                    {showAllProjects ? t("Recolher") : t("Mostrar tudo")}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="c-selector__filters">
            <div className="selector-filter-label">✨ {t("Tarefa")}</div>
            {tasksInProject.length === 0 ? (
              <div className="task-selector-empty selector-inline-empty">
                <p>{t("Nenhuma task neste projeto. Crie tasks na aba Tasks!")}</p>
              </div>
            ) : (
              <div className="c-selector__grid">
                {visibleTasks.map((task) => (
                  <TaskCard key={task.id} task={task} selected={selectedTask?.id === task.id} onClick={onSelectTask} />
                ))}
                {tasksInProject.length > 5 && (
                  <button
                    type="button"
                    className="c-selector__toggle-btn c-selector__toggle-btn--grid"
                    onClick={() => setShowAllTasks(p => !p)}
                  >
                    {showAllTasks ? t("Recolher") : t("Mostrar tudo")}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
