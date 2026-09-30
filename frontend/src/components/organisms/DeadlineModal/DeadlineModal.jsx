import Input from '../../atoms/Input/Input';
import Select from '../../atoms/Select/Select';
import Spinner from '../../atoms/Spinner/Spinner';
import { useLanguage } from '../../../contexts/LanguageContext';
import './DeadlineModal.css';

function formatDateBR(isoDate) {
  if (!isoDate) return '—';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function formatDateTimeBR(isoDateTime) {
  if (!isoDateTime) return '';
  try {
    return new Date(isoDateTime).toLocaleString('pt-BR');
  } catch {
    return isoDateTime;
  }
}

export default function DeadlineModal({
  open,
  editingEventId,
  editingType,
  projects,
  tasks,
  formProjectId,
  setFormProjectId,
  formTaskId,
  setFormTaskId,
  formDeadline,
  setFormDeadline,
  formStatus,
  setFormStatus,
  formNotes,
  setFormNotes,
  statusConfig,
  loadingHistory,
  history,
  saving,
  onClose,
  onRemoveDeadline,
  onSave,
}) {
  const { t } = useLanguage();
  if (!open) return null;

  const projectTasks = tasks.filter((task) => String(task.project_id) === String(formProjectId));

  return (
    <div className="c-modal-overlay" onClick={onClose}>
      <div className="c-modal o-card--static" onClick={(event) => event.stopPropagation()}>
        <div className="c-modal__header">
          <h3>{editingEventId ? `✏️ ${t('Editar Compromisso')}` : `📌 ${t('Novo Compromisso')}`}</h3>
          <button className="c-btn--icon" onClick={onClose}>✕</button>
        </div>

        <div className="c-modal__body">
          {!editingEventId ? (
            <>
              <div className="c-task-form__field">
                <label className="c-task-form__label">{t('Projeto')}</label>
                <Select value={formProjectId} onChange={(event) => setFormProjectId(event.target.value)}>
                  <option value="">{t('Selecione um projeto...')}</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      [{project.category}] {project.name}
                    </option>
                  ))}
                </Select>
              </div>

              {formProjectId && (
                <div className="c-task-form__field c-modal__form-spacing">
                  <label className="c-task-form__label">{t('Tarefa (Opcional)')}</label>
                  <Select value={formTaskId} onChange={(event) => setFormTaskId(event.target.value)}>
                    <option value="">{t('Nenhuma task (Aplicar ao Projeto)')}</option>
                    {projectTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </>
          ) : null}

          {editingEventId ? (
            <div className="c-modal__project-name">
              📁 {projects.find((project) => String(project.id) === String(formProjectId))?.name}
              {editingType === 'task' && ` > 📋 ${tasks.find((task) => String(task.id) === String(editingEventId))?.name}`}
            </div>
          ) : null}

          <div className="c-task-form__field c-modal__form-spacing">
            <label className="c-task-form__label">{t('Data Agendada')}</label>
            <Input type="date" value={formDeadline} onChange={(event) => setFormDeadline(event.target.value)} />
          </div>

          <div className="c-task-form__field c-modal__form-spacing">
            <label className="c-task-form__label">{t('Status')}</label>
            <Select value={formStatus} onChange={(event) => setFormStatus(event.target.value)}>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </Select>
          </div>

          <div className="c-task-form__field c-modal__form-spacing">
            <label className="c-task-form__label">{t('Observações')}</label>
            <Input as="textarea" rows={3} value={formNotes} onChange={(event) => setFormNotes(event.target.value)} placeholder={t('Observações sobre o compromisso...')} />
          </div>

          {editingEventId ? (
            <div className="c-modal__history-section">
              <div className="c-modal__history-title">🕓 {t('Histórico de Alterações de Prazo')}</div>
              {loadingHistory ? (
                <div className="c-modal__history-loading"><Spinner /></div>
              ) : history.length === 0 ? (
                <div className="c-modal__history-empty">{t('Nenhuma alteração de prazo registrada ainda.')}</div>
              ) : (
                <ul className="c-modal__history-list">
                  {history.map((item) => (
                    <li key={item.id} className="c-modal__history-item">
                      <span className="font-mono">{formatDateBR(item.old_deadline)} → {formatDateBR(item.new_deadline)}</span>
                      <span className="c-modal__history-date">{formatDateTimeBR(item.changed_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        <div className="c-modal__actions">
          {editingEventId ? (
            <button className="c-btn c-btn--ghost" onClick={onRemoveDeadline} disabled={saving} style={{ color: 'var(--color-danger)' }}>
              {t('Remover Compromisso')}
            </button>
          ) : null}
          <button className="c-btn c-btn--ghost" onClick={onClose}>{t('Cancelar')}</button>
          <button className="c-btn c-btn--primary" onClick={onSave} disabled={saving}>{saving ? t('Salvando...') : t('Salvar')}</button>
        </div>
      </div>
    </div>
  );
}
