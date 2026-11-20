(() => {
  'use strict';

  const SAVE_KEY = 'cmr_v2_save_v2';
  let ctx = null, timer = null, step = 0, currentTrack = 'map', unlocked = false;

  const TRACKS = {
    map: {
      tempo: 390,
      wave: 'triangle',
      vol: 0.045,
      notes: [261.6, 329.6, 392.0, 523.3, 493.9, 392.0, 329.6, 293.7, 349.2, 440.0, 523.3, 440.0, 392.0, 329.6, 293.7, 261.6]
    },
    play: {
      tempo: 310,
      wave: 'sine',
      vol: 0.04,
      notes: [329.6, 392.0, 440.0, 523.3, 587.3, 523.3, 440.0, 392.0, 349.2, 440.0, 493.9, 587.3, 523.3, 440.0, 392.0, 329.6]
    },
    boss: {
      tempo: 220,
      wave: 'sawtooth',
      vol: 0.032,
      notes: [146.8, 174.6, 220.0, 207.7, 174.6, 146.8, 130.8, 146.8, 220.0, 261.6, 233.1, 220.0, 174.6, 164.8, 146.8, 110.0]
    }
  };

  function isMuted() {
    try { return !!JSON.parse(localStorage.getItem(SAVE_KEY) || '{}').muted; }
    catch { return false; }
  }

  function detectTrack() {
    const game = document.getElementById('gameScreen');
    const boss = document.getElementById('bossBarWrap');
    if (game && game.classList.contains('active')) {
      return (boss && boss.style.display !== 'none') ? 'boss' : 'play';
    }
    return 'map';
  }

  function playNote(freq, wave, vol, dur) {
    if (!ctx || isMuted() || document.hidden) return;
    try {
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = wave;
      o.frequency.setValueAtTime(freq, now);
      f.type = 'lowpass';
      f.frequency.setValueAtTime(wave === 'sawtooth' ? 900 : 1800, now);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(vol, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
      o.connect(f); f.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + dur + 0.02);
    } catch {}
  }

  function schedule() {
    clearTimeout(timer);
    const desired = detectTrack();
    if (desired !== currentTrack) { currentTrack = desired; step = 0; }
    const t = TRACKS[currentTrack];
    if (unlocked && !isMuted() && !document.hidden) {
      const note = t.notes[step % t.notes.length];
      playNote(note, t.wave, t.vol, (t.tempo / 1000) * 0.9);
      if (step % 4 === 0) playNote(note / 2, 'sine', t.vol * 0.85, (t.tempo / 1000) * 1.6);
      step++;
    }
    timer = setTimeout(schedule, t.tempo);
  }

  function unlockAudio() {
    if (unlocked) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      unlocked = true;
      schedule();
    } catch {}
  }

  window.addEventListener('pointerdown', unlockAudio, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (ctx && !document.hidden && ctx.state === 'suspended') ctx.resume().catch(() => {});
  });

  window.CMRAudio = {
    unlock: unlockAudio,
    getTrack: () => currentTrack,
    playFanfare: () => {
      if (!ctx || isMuted()) return;
      [523.3, 659.3, 784.0, 1046.5].forEach((n, i) => setTimeout(() => playNote(n, 'triangle', 0.09, 0.25), i * 90));
    }
  };
})();
