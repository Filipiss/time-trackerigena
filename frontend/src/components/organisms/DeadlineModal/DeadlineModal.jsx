import Input from '../../atoms/Input/Input';
import Select from '../../atoms/Select/Select';
import Spinner from '../../atoms/Spinner/Spinner';
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
  if (!open) return null;

  const projectTasks = tasks.filter((t) => String(t.project_id) === String(formProjectId));

  return (
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div className="calendar-modal glass-card-static" onClick={(event) => event.stopPropagation()}>
        <div className="calendar-modal-header">
          <h3>{editingEventId ? '✏️ Editar Compromisso' : '📌 Novo Compromisso'}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="calendar-modal-body">
          {!editingEventId ? (
            <>
              <div className="task-form-field">
                <label className="task-form-label">Projeto</label>
                <Select value={formProjectId} onChange={(event) => setFormProjectId(event.target.value)}>
                  <option value="">Selecione um projeto...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      [{project.category}] {project.name}
                    </option>
                  ))}
                </Select>
              </div>

              {formProjectId && (
                <div className="task-form-field modal-form-spacing">
                  <label className="task-form-label">Tarefa (Opcional)</label>
                  <Select value={formTaskId} onChange={(event) => setFormTaskId(event.target.value)}>
                    <option value="">Nenhuma task (Aplicar ao Projeto)</option>
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
            <div className="calendar-modal-project-name">
              📁 {projects.find((project) => String(project.id) === String(formProjectId))?.name}
              {editingType === 'task' && ` > 📋 ${tasks.find((task) => String(task.id) === String(editingEventId))?.name}`}
            </div>
          ) : null}

          <div className="task-form-field modal-form-spacing">
            <label className="task-form-label">Data Agendada</label>
            <Input type="date" value={formDeadline} onChange={(event) => setFormDeadline(event.target.value)} />
          </div>

          <div className="task-form-field modal-form-spacing">
            <label className="task-form-label">Status</label>
            <Select value={formStatus} onChange={(event) => setFormStatus(event.target.value)}>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </Select>
          </div>

          <div className="task-form-field modal-form-spacing">
            <label className="task-form-label">Observações</label>
            <Input as="textarea" rows={3} value={formNotes} onChange={(event) => setFormNotes(event.target.value)} placeholder="Observações sobre o compromisso..." />
          </div>

          {editingEventId ? (
            <div className="calendar-history-section">
              <div className="calendar-history-title">🕓 Histórico de Alterações de Prazo</div>
              {loadingHistory ? (
                <div className="calendar-history-loading"><Spinner /></div>
              ) : history.length === 0 ? (
                <div className="calendar-history-empty">Nenhuma alteração de prazo registrada ainda.</div>
              ) : (
                <ul className="calendar-history-list">
                  {history.map((item) => (
                    <li key={item.id} className="calendar-history-item">
                      <span className="font-mono">{formatDateBR(item.old_deadline)} → {formatDateBR(item.new_deadline)}</span>
                      <span className="calendar-history-date">{formatDateTimeBR(item.changed_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        <div className="calendar-modal-actions">
          {editingEventId ? (
            <button className="btn btn-ghost" onClick={onRemoveDeadline} disabled={saving} style={{ color: 'var(--color-danger)' }}>
              Remover Compromisso
            </button>
          ) : null}
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  );
}
