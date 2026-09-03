/**
 * Zenitude.ai — Floating Real-Time Celebration Reaction Bar & Soundboard
 * Multi-particle physics bursts & synthesized Web Audio celebration chimes
 */
(function (window) {
  'use strict';

  let soundEnabled = true;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Synthesize rich celebration sound effects
  function playCelebrationSound(type) {
    if (!soundEnabled) return;
    initAudio();

    const now = audioCtx.currentTime;

    if (type === '🎉' || type === 'party') {
      // Party popper pop & sparkles
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.16);

    } else if (type === '🥂' || type === 'champagne') {
      // Crystal glass clink
      [1800, 2400].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.18, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + 1.3);
      });

    } else if (type === '🎂' || type === 'cake') {
      // Festive Major Chord Arpeggio (C - E - G - C)
      [523.25, 659.25, 783.99, 1046.50].forEach((note, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note, now + i * 0.07);
        gain.gain.setValueAtTime(0.14, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.8);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.85);
      });

    } else if (type === '❤️' || type === 'heart') {
      // Warm resonant bell chime
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 1.6);

    } else if (type === '🚀' || type === 'rocket') {
      // Sci-fi milestone whoosh
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    }
  }

  // Spawn floating physics emoji particles
  function spawnFloatingEmoji(emoji, originX, originY) {
    const count = 7;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'floating-reaction-particle';
      particle.textContent = emoji;

      const startX = (originX || window.innerWidth / 2) + (Math.random() - 0.5) * 60;
      const startY = (originY || window.innerHeight - 80) + (Math.random() - 0.5) * 30;
      const driftX = (Math.random() - 0.5) * 140;
      const driftY = - (180 + Math.random() * 220);
      const rot = (Math.random() - 0.5) * 70;
      const scale = 0.8 + Math.random() * 0.7;

      particle.style.left = `${startX}px`;
      particle.style.top = `${startY}px`;
      particle.style.setProperty('--drift-x', `${driftX}px`);
      particle.style.setProperty('--drift-y', `${driftY}px`);
      particle.style.setProperty('--drift-rot', `${rot}deg`);
      particle.style.setProperty('--scale', `${scale}`);

      document.body.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 1600);
    }

    // Confetti burst on popper
    if (emoji === '🎉' && typeof confetti === 'function') {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x: (originX || window.innerWidth / 2) / window.innerWidth, y: (originY || window.innerHeight) / window.innerHeight }
      });
    }
  }

  // Build floating reaction dock
  function mountReactionDock() {
    if (document.getElementById('floating-reaction-dock')) return;

    const dock = document.createElement('div');
    dock.id = 'floating-reaction-dock';
    dock.className = 'floating-reaction-dock';
    dock.innerHTML = `
      <div class="reaction-dock-inner">
        <button type="button" class="reaction-emoji-btn" data-emoji="🎉" title="Send Party Popper!">🎉</button>
        <button type="button" class="reaction-emoji-btn" data-emoji="🥂" title="Raise a Toast!">🥂</button>
        <button type="button" class="reaction-emoji-btn" data-emoji="🎂" title="Send Birthday Cake!">🎂</button>
        <button type="button" class="reaction-emoji-btn" data-emoji="❤️" title="Send Heartfelt Warmth!">❤️</button>
        <button type="button" class="reaction-emoji-btn" data-emoji="🚀" title="Celebrate Milestone!">🚀</button>
        <div class="reaction-dock-divider"></div>
        <button type="button" id="reaction-sound-toggle-btn" class="reaction-sound-toggle-btn" title="Toggle Soundboard Audio">
          <span id="reaction-sound-icon">🔊</span>
        </button>
      </div>
    `;

    document.body.appendChild(dock);

    // Event listeners
    dock.querySelectorAll('.reaction-emoji-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const emoji = btn.getAttribute('data-emoji');
        const rect = btn.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top;

        btn.classList.add('pulse');
        setTimeout(() => btn.classList.remove('pulse'), 300);

        playCelebrationSound(emoji);
        spawnFloatingEmoji(emoji, originX, originY);
      });
    });

    const soundBtn = document.getElementById('reaction-sound-toggle-btn');
    const soundIcon = document.getElementById('reaction-sound-icon');
    if (soundBtn && soundIcon) {
      soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
      });
    }
  }

  document.addEventListener('DOMContentLoaded', mountReactionDock);

  window.FloatingReactions = {
    trigger: (emoji, x, y) => {
      playCelebrationSound(emoji);
      spawnFloatingEmoji(emoji, x, y);
    }
  };

})(window);
