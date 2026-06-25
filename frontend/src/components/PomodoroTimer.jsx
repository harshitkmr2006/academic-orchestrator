import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Brain, Coffee } from 'lucide-react';

export default function PomodoroTimer() {
  const [isBreak, setIsBreak] = useState(false);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const timerRef = useRef(null);

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      
      const playNote = (freq, time, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(time);
        osc.stop(time + duration);
      };

      const now = audioCtx.currentTime;
      playNote(523.25, now, 0.35); // C5
      playNote(659.25, now + 0.15, 0.5); // E5
    } catch (err) {
      console.error('Web Audio chime playback failed:', err);
    }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            playChime();
            const nextMode = !isBreak;
            setIsBreak(nextMode);
            setMinutes(nextMode ? 5 : 25);
            setSeconds(0);
            setIsActive(false);
          } else {
            setMinutes((prev) => prev - 1);
            setSeconds(59);
          }
        } else {
          setSeconds((prev) => prev - 1);
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, minutes, seconds, isBreak]);

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setMinutes(isBreak ? 5 : 25);
    setSeconds(0);
  };

  const handleModeSwitch = (toBreak) => {
    setIsActive(false);
    setIsBreak(toBreak);
    setMinutes(toBreak ? 5 : 25);
    setSeconds(0);
  };

  const radius = 80;
  const circumference = 2 * Math.PI * radius; // ~502.65
  const totalSeconds = isBreak ? 5 * 60 : 25 * 60;
  const currentSeconds = minutes * 60 + seconds;
  const progress = totalSeconds > 0 ? (currentSeconds / totalSeconds) : 0;
  const strokeDashoffset = circumference - (circumference * progress);

  const formatTimeVal = (val) => (val < 10 ? `0${val}` : val);

  return (
    <div className="card glass-card pomodoro-timer-card glowing-border">
      <div className="ai-header">
        <div className="ai-title-wrap">
          <Clock className="icon-primary pulsing" size={28} />
          <div>
            <h3>Focus Timer</h3>
            <span className="ai-status">{isBreak ? 'Short Break Active' : 'Focus Session Active'}</span>
          </div>
        </div>
      </div>

      <div className="timer-mode-buttons">
        <button
          onClick={() => handleModeSwitch(false)}
          className={`mode-btn ${!isBreak ? 'active focus-mode' : ''}`}
        >
          <Brain size={16} style={{ marginRight: '6px' }} />
          Focus (25m)
        </button>
        <button
          onClick={() => handleModeSwitch(true)}
          className={`mode-btn ${isBreak ? 'active break-mode' : ''}`}
        >
          <Coffee size={16} style={{ marginRight: '6px' }} />
          Break (5m)
        </button>
      </div>

      <div className="timer-display-container">
        <svg className="timer-svg" width="200" height="200">
          <circle
            className="timer-rail"
            cx="100"
            cy="100"
            r={radius}
            strokeWidth="8"
          />
          <circle
            className={`timer-fill ${isBreak ? 'fill-break' : 'fill-focus'}`}
            cx="100"
            cy="100"
            r={radius}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 100 100)"
          />
        </svg>

        <div className="timer-readout-wrap">
          <div className="timer-countdown">
            {formatTimeVal(minutes)}:{formatTimeVal(seconds)}
          </div>
          <span className="timer-state-label">
            {isBreak ? 'Take a breather' : 'Time to concentrate'}
          </span>
        </div>
      </div>

      <div className="timer-controls">
        <button 
          onClick={handleStartPause} 
          className={`btn ${isActive ? 'btn-secondary' : 'btn-primary'}`}
          style={{ width: 'auto', minWidth: '130px' }}
        >
          {isActive ? <Pause size={18} /> : <Play size={18} />}
          <span>{isActive ? 'Pause' : 'Start'}</span>
        </button>
        <button 
          onClick={handleReset} 
          className="btn btn-secondary reset-timer-btn"
          style={{ width: 'auto', padding: '0.75rem 1rem' }}
          title="Reset Timer"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
