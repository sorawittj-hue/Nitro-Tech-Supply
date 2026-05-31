import React, { useState, useEffect, useRef, useCallback } from 'react';

const TRACKS = [
  { name: 'Midnight Coding Session', artist: 'LoFi Chill', duration: 245 },
  { name: 'Rain on the Rooftop', artist: 'Ambient Dreams', duration: 198 },
  { name: 'Coffee & Keyboards', artist: 'Dev Beats', duration: 312 },
  { name: 'Neon City Lights', artist: 'Synthwave Lo', duration: 267 },
  { name: 'Sunday Morning Debug', artist: 'Code Jazz', duration: 224 },
];

export const LofiPlayer: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const track = TRACKS[currentTrack];
  const progress = (elapsed / track.duration) * 100;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setElapsed(prev => {
        if (prev >= track.duration) {
          setCurrentTrack(t => (t + 1) % TRACKS.length);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, track.duration]);

  const startAudio = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      oscillatorRef.current = osc;
    } catch {}
  }, []);

  const stopAudio = useCallback(() => {
    try {
      oscillatorRef.current?.stop();
      audioCtxRef.current?.close();
    } catch {}
    oscillatorRef.current = null;
    audioCtxRef.current = null;
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    setCurrentTrack(t => (t + 1) % TRACKS.length);
    setElapsed(0);
  };

  const prevTrack = () => {
    setCurrentTrack(t => (t - 1 + TRACKS.length) % TRACKS.length);
    setElapsed(0);
  };

  return (
    <div>
      <div className="lofi-track">
        <div className="lofi-track-name">{track.name}</div>
        <div className="lofi-track-artist">{track.artist}</div>
      </div>

      <div className="lofi-progress-track">
        <div className="lofi-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="lofi-times">
        <span>{formatTime(elapsed)}</span>
        <span>{formatTime(track.duration)}</span>
      </div>

      <div className="lofi-controls">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={prevTrack} className="btn-icon" style={{ width: '28px', height: '28px', fontSize: '14px' }}>⏮</button>
          <button onClick={togglePlay} className={`play-btn ${isPlaying ? 'playing' : ''}`}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={nextTrack} className="btn-icon" style={{ width: '28px', height: '28px', fontSize: '14px' }}>⏭</button>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-muted)' }}>
          {currentTrack + 1}/{TRACKS.length}
        </div>
      </div>
    </div>
  );
};
