import { useState, useRef, useCallback, useEffect } from 'react';
import { createTimeEntry } from '../api';
import './Timer.css';

// Formata milissegundos em HH:MM:SS
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    totalSeconds,
  };
}

function formatDurationHuman(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(' ');
}

const TIMER_STATES = {
  STOPPED: 'stopped',
  RUNNING: 'running',
  PAUSED: 'paused',
};

export default function Timer({ selectedTask, onSaveSuccess }) {
  const [timerState, setTimerState] = useState(() => {
    return localStorage.getItem('tracker_timerState') || TIMER_STATES.STOPPED;
  });
  
  const accumulatedRef = useRef(parseInt(localStorage.getItem('tracker_accumulated') || '0', 10));
  const startTimeRef = useRef(
    localStorage.getItem('tracker_startTime') ? parseInt(localStorage.getItem('tracker_startTime'), 10) : null
  );

  const [elapsedTime, setElapsedTime] = useState(accumulatedRef.current);

  const [showSaveArea, setShowSaveArea] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const intervalRef = useRef(null);

  const persistState = (state, accumulated, start) => {
    localStorage.setItem('tracker_timerState', state);
    localStorage.setItem('tracker_accumulated', accumulated.toString());
    if (start) localStorage.setItem('tracker_startTime', start.toString());
    else localStorage.removeItem('tracker_startTime');
  };

  const tick = useCallback(() => {
    if (startTimeRef.current) {
      const now = Date.now();
      const elapsed = accumulatedRef.current + (now - startTimeRef.current);
      setElapsedTime(elapsed);
    }
  }, []);

  // Se o timer estiver RUNNING ao carregar, inicia o tick imediatamente para calcular o tempo offline
  useEffect(() => {
    if (timerState === TIMER_STATES.RUNNING && startTimeRef.current) {
      // Calcula o tempo que passou com a aba fechada e atualiza a tela instantaneamente
      tick(); 
      intervalRef.current = setInterval(tick, 50);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []); // Roda só no mount

  const handleStart = useCallback(() => {
    if (timerState === TIMER_STATES.RUNNING) return;

    startTimeRef.current = Date.now();
    const newState = TIMER_STATES.RUNNING;
    setTimerState(newState);
    
    persistState(newState, accumulatedRef.current, startTimeRef.current);
    
    intervalRef.current = setInterval(tick, 50);
  }, [timerState, tick]);

  const handlePause = useCallback(() => {
    if (timerState !== TIMER_STATES.RUNNING) return;

    accumulatedRef.current += Date.now() - startTimeRef.current;
    startTimeRef.current = null;

    clearInterval(intervalRef.current);
    intervalRef.current = null;

    const newState = TIMER_STATES.PAUSED;
    setTimerState(newState);
    
    persistState(newState, accumulatedRef.current, startTimeRef.current);
  }, [timerState]);

  const handleStop = useCallback(() => {
    if (timerState === TIMER_STATES.STOPPED) return;

    if (timerState === TIMER_STATES.RUNNING && startTimeRef.current) {
      accumulatedRef.current += Date.now() - startTimeRef.current;
      setElapsedTime(accumulatedRef.current);
    }

    clearInterval(intervalRef.current);
    intervalRef.current = null;
    startTimeRef.current = null;

    const newState = TIMER_STATES.STOPPED;
    setTimerState(newState);
    
    persistState(newState, accumulatedRef.current, startTimeRef.current);
  }, [timerState]);

  const handleRestart = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    
    startTimeRef.current = Date.now();
    accumulatedRef.current = 0;
    
    setElapsedTime(0);
    const newState = TIMER_STATES.RUNNING;
    setTimerState(newState);
    setShowSaveArea(false);
    setNotes('');

    persistState(newState, accumulatedRef.current, startTimeRef.current);

    intervalRef.current = setInterval(tick, 50);
  }, [tick]);

  const handleSaveClick = useCallback(() => {
    if (timerState === TIMER_STATES.RUNNING) {
      handlePause();
    }
    setShowSaveArea(true);
  }, [timerState, handlePause]);

  const handleSave = useCallback(async () => {
    if (!selectedTask || elapsedTime < 1000) return;

    setSaving(true);
    try {
      const durationSeconds = Math.floor(elapsedTime / 1000);

      await createTimeEntry({
        task_id: selectedTask.id,
        duration_seconds: durationSeconds,
        notes: notes.trim() || null,
        date: new Date().toISOString().split('T')[0],
      });

      clearInterval(intervalRef.current);
      intervalRef.current = null;
      startTimeRef.current = null;
      accumulatedRef.current = 0;
      setElapsedTime(0);
      
      const newState = TIMER_STATES.STOPPED;
      setTimerState(newState);
      persistState(newState, 0, null);
      
      setShowSaveArea(false);
      setNotes('');
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      console.error('Erro ao salvar time entry:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [selectedTask, elapsedTime, notes]);

  const time = formatTime(elapsedTime);
  const canStart = timerState !== TIMER_STATES.RUNNING;
  const canPause = timerState === TIMER_STATES.RUNNING;
  const canStop = timerState !== TIMER_STATES.STOPPED;
  const canSave = elapsedTime >= 1000 && selectedTask;

  return (
    <div className="timer-container">
      {selectedTask ? (
        <div className="timer-selected-task">
          <div className="task-label">Cronometrando</div>
          <div className="task-name">
            <span
              className="task-color-dot"
              style={{ backgroundColor: selectedTask.color || '#06b6d4' }}
            />
            {selectedTask.project_name ? `[${selectedTask.project_name}] ` : ''}{selectedTask.name}
          </div>
        </div>
      ) : (
        <div className="timer-no-task">
          ⚡ Selecione uma task abaixo para começar a cronometrar
        </div>
      )}

      <div className={`timer-display-wrapper ${timerState}`}>
        <div className="timer-status-indicator">
          <span className={`status-dot ${timerState}`} />
          <span className={`status-label ${timerState}`}>
            {timerState === TIMER_STATES.RUNNING && 'Rodando'}
            {timerState === TIMER_STATES.PAUSED && 'Pausado'}
            {timerState === TIMER_STATES.STOPPED && 'Parado'}
          </span>
        </div>

        <div className={`timer-digits ${timerState}`}>
          {time.hours}
          <span className="separator">:</span>
          {time.minutes}
          <span className="separator">:</span>
          {time.seconds}
        </div>
      </div>

      <div className="timer-controls">
        <button className="timer-btn timer-btn-start" onClick={handleStart} disabled={!canStart} title="Iniciar">▶</button>
        <button className="timer-btn timer-btn-pause" onClick={handlePause} disabled={!canPause} title="Pausar">⏸</button>
        <button className="timer-btn timer-btn-stop" onClick={handleStop} disabled={!canStop} title="Parar">⏹</button>
        <button className="timer-btn timer-btn-restart" onClick={handleRestart} disabled={timerState === TIMER_STATES.STOPPED && elapsedTime === 0} title="Reiniciar">🔄</button>
        <button className="timer-btn timer-btn-save" onClick={handleSaveClick} disabled={!canSave} title="Salvar">💾 Salvar</button>
      </div>

      {showSaveArea && (
        <div className="timer-save-area">
          <div className="save-area-inner">
            <div className="save-area-title">💾 Salvar Registro de Tempo</div>
            <div className="save-duration">⏱ Duração: {formatDurationHuman(elapsedTime)} ({time.formatted})</div>
            <textarea
              className="input"
              placeholder="Notas sobre o que foi feito (opcional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <div className="save-area-actions">
              <button className="btn btn-ghost" onClick={() => setShowSaveArea(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Confirmar e Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
