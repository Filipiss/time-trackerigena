import { useCallback, useEffect, useRef, useState } from 'react';
import { createTimeEntry } from '../../../api';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Play, Pause, RotateCcw } from 'lucide-react';
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


const TIMER_STATES = {
  STOPPED: 'stopped',
  RUNNING: 'running',
  PAUSED: 'paused',
};

export default function TimerWidget({ selectedTask, onSaveSuccess }) {
  const { t } = useLanguage();
  const [timerState, setTimerState] = useState(() => localStorage.getItem('tracker_timerState') || TIMER_STATES.STOPPED);
  const initialAccumulated = parseInt(localStorage.getItem('tracker_accumulated') || '0', 10);
  const accumulatedRef = useRef(initialAccumulated);
  const startTimeRef = useRef(
    localStorage.getItem('tracker_startTime') ? parseInt(localStorage.getItem('tracker_startTime'), 10) : null,
  );
  const intervalRef = useRef(null);

  const [elapsedTime, setElapsedTime] = useState(initialAccumulated);
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
    window.dispatchEvent(new CustomEvent('timer-state-change'));
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

  const handleRestart = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    startTimeRef.current = null;
    accumulatedRef.current = 0;
    setElapsedTime(0);
    setTimerState(TIMER_STATES.STOPPED);
    setNotes('');
    persistState(TIMER_STATES.STOPPED, 0, null);
  }, [persistState]);

  // Se a task for deletada globalmente (selectedTask === null) e o timer tiver algo, reseta forçadamente
  useEffect(() => {
    if (!selectedTask && (timerState !== TIMER_STATES.STOPPED || elapsedTime > 0)) {
      const timer = setTimeout(() => {
        handleRestart();
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [selectedTask, timerState, elapsedTime, handleRestart]);


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
  const canSave = elapsedTime >= 1000 && selectedTask;

  return (
    <div className="timer-bar-container">
      {/* 1. Descrição ou Nota atual */}
      <div className="timer-bar-input-section">
        <input
          type="text"
          className="timer-bar-notes-input"
          placeholder={selectedTask ? t("No que você está trabalhando?") : t("Selecione uma Task abaixo para começar...")}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={!selectedTask}
        />
      </div>

      {/* 2. Task Selecionada (Indicador Visual) */}
      <div className="timer-bar-task-badge">
        {selectedTask ? (
          <div className="timer-bar-task-info">
            <span className="task-color-dot" style={{ backgroundColor: selectedTask.color || '#03a9f4' }} />
            <span className="task-badge-project">{t(selectedTask.project_name || 'Sem Projeto')}</span>
            <span className="task-badge-divider">/</span>
            <span className="task-badge-name">{selectedTask.name}</span>
          </div>
        ) : (
          <div className="timer-bar-task-placeholder">
            {t("Nenhuma Task selecionada")}
          </div>
        )}
      </div>

      {/* 3. Cronômetro / Tempo Decorrido */}
      <div className={`timer-bar-display ${timerState}`}>
        <span className="timer-digits-mono">
          {time.hours}:{time.minutes}:{time.seconds}
        </span>
      </div>

      {/* 4. Controles de Ação */}
      <div className="timer-bar-controls">
        {timerState !== TIMER_STATES.RUNNING ? (
          <button className="timer-bar-btn start" onClick={handleStart} disabled={!canStart} title={t("Iniciar")}>
            <Play size={16} fill="currentColor" /> {t("Iniciar")}
          </button>
        ) : (
          <button className="timer-bar-btn pause" onClick={handlePause} title={t("Pausar")}>
            <Pause size={16} fill="currentColor" /> {t("Pausar")}
          </button>
        )}

        <button className="timer-bar-btn restart" onClick={handleRestart} disabled={timerState === TIMER_STATES.STOPPED && elapsedTime === 0} title={t("Resetar")}>
          <RotateCcw size={14} />
        </button>

        <button className="timer-bar-btn save" onClick={handleSave} disabled={!canSave || saving} title={t("Salvar Registro")}>
          {saving ? '...' : t("Salvar")}
        </button>
      </div>
    </div>
  );
}
