import { useCallback, useEffect, useRef, useState } from 'react';
import ColorDot from '../../atoms/ColorDot/ColorDot';
import Input from '../../atoms/Input/Input';
import { createTimeEntry } from '../../../api';
import './TimerWidget.css';

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

export default function TimerWidget({ selectedTask, onSaveSuccess }) {
  const [timerState, setTimerState] = useState(() => localStorage.getItem('tracker_timerState') || TIMER_STATES.STOPPED);
  const initialAccumulated = parseInt(localStorage.getItem('tracker_accumulated') || '0', 10);
  const accumulatedRef = useRef(initialAccumulated);
  const startTimeRef = useRef(
    localStorage.getItem('tracker_startTime') ? parseInt(localStorage.getItem('tracker_startTime'), 10) : null,
  );
  const intervalRef = useRef(null);

  const [elapsedTime, setElapsedTime] = useState(initialAccumulated);
  const [showSaveArea, setShowSaveArea] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const persistState = useCallback((state, accumulated, start) => {
    localStorage.setItem('tracker_timerState', state);
    localStorage.setItem('tracker_accumulated', accumulated.toString());
    if (start) {
      localStorage.setItem('tracker_startTime', start.toString());
    } else {
      localStorage.removeItem('tracker_startTime');
    }
  }, []);

  const tick = useCallback(() => {
    if (startTimeRef.current) {
      const now = Date.now();
      setElapsedTime(accumulatedRef.current + (now - startTimeRef.current));
    }
  }, []);

  useEffect(() => {
    if (timerState !== TIMER_STATES.RUNNING || !startTimeRef.current || intervalRef.current) {
      return undefined;
    }

    tick();
    intervalRef.current = setInterval(tick, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [tick, timerState]);



  const handleStart = useCallback(() => {
    if (timerState === TIMER_STATES.RUNNING) return;
    startTimeRef.current = Date.now();
    setTimerState(TIMER_STATES.RUNNING);
    persistState(TIMER_STATES.RUNNING, accumulatedRef.current, startTimeRef.current);
  }, [persistState, timerState]);

  const handlePause = useCallback(() => {
    if (timerState !== TIMER_STATES.RUNNING || !startTimeRef.current) return;

    accumulatedRef.current += Date.now() - startTimeRef.current;
    startTimeRef.current = null;
    setElapsedTime(accumulatedRef.current);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setTimerState(TIMER_STATES.PAUSED);
    persistState(TIMER_STATES.PAUSED, accumulatedRef.current, startTimeRef.current);
  }, [persistState, timerState]);

  const handleStop = useCallback(() => {
    if (timerState === TIMER_STATES.STOPPED) return;

    if (timerState === TIMER_STATES.RUNNING && startTimeRef.current) {
      accumulatedRef.current += Date.now() - startTimeRef.current;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    startTimeRef.current = null;
    setElapsedTime(accumulatedRef.current);
    setTimerState(TIMER_STATES.STOPPED);
    persistState(TIMER_STATES.STOPPED, accumulatedRef.current, startTimeRef.current);
  }, [persistState, timerState]);

  const handleRestart = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    startTimeRef.current = null;
    accumulatedRef.current = 0;
    setElapsedTime(0);
    setTimerState(TIMER_STATES.STOPPED);
    setShowSaveArea(false);
    setNotes('');
    persistState(TIMER_STATES.STOPPED, 0, null);
  }, [persistState]);

  // Se a task for deletada globalmente (selectedTask === null) e o timer tiver algo, reseta forçadamente
  useEffect(() => {
    if (!selectedTask && (timerState !== TIMER_STATES.STOPPED || elapsedTime > 0)) {
      handleRestart();
    }
  }, [selectedTask, timerState, elapsedTime, handleRestart]);

  const handleSaveClick = useCallback(() => {
    if (timerState === TIMER_STATES.RUNNING) {
      handlePause();
    }
    setShowSaveArea(true);
  }, [handlePause, timerState]);

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

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      startTimeRef.current = null;
      accumulatedRef.current = 0;
      setElapsedTime(0);
      setTimerState(TIMER_STATES.STOPPED);
      persistState(TIMER_STATES.STOPPED, 0, null);
      setShowSaveArea(false);
      setNotes('');
      onSaveSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar time entry:', error);
      window.alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }, [elapsedTime, notes, onSaveSuccess, persistState, selectedTask]);

  const time = formatTime(elapsedTime);
  const canStart = timerState !== TIMER_STATES.RUNNING && !!selectedTask;
  const canPause = timerState === TIMER_STATES.RUNNING;
  const canStop = timerState !== TIMER_STATES.STOPPED;
  const canSave = elapsedTime >= 1000 && selectedTask;

  return (
    <div className="timer-container">
      {selectedTask ? (
        <div className="timer-selected-task">
          <div className="task-label">CRONOMETRANDO</div>
          <div className="task-name">
            <ColorDot className="task-color-dot" color={selectedTask.color || '#06b6d4'} size="10px" />
            {selectedTask.project_name ? `[${selectedTask.project_name}] ` : ''}
            {selectedTask.name}
          </div>
        </div>
      ) : (
        <div className="timer-no-task">⚡ Para começar a cronometrar, selecione ou crie uma nova Task.</div>
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
        <button
          className="timer-btn timer-btn-restart"
          onClick={handleRestart}
          disabled={timerState === TIMER_STATES.STOPPED && elapsedTime === 0}
          title="Reiniciar"
        >
          🔄
        </button>
        <button className="timer-btn timer-btn-save" onClick={handleSaveClick} disabled={!canSave} title="Salvar">
          💾 Salvar
        </button>
      </div>

      {showSaveArea ? (
        <div className="timer-save-area">
          <div className="save-area-inner">
            <div className="save-area-title">💾 Salvar Registro de Tempo</div>
            <div className="save-duration">⏱ Duração: {formatDurationHuman(elapsedTime)} ({time.formatted})</div>
            <Input
              as="textarea"
              placeholder="Notas sobre o que foi feito (opcional)..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
            <div className="save-area-actions">
              <button className="btn btn-ghost" onClick={() => setShowSaveArea(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Confirmar e Salvar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
