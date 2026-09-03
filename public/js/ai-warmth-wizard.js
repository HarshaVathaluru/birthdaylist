/**
 * Zenitude.ai — AI Warmth Wizard
 * Intelligent celebratory wish generator with multi-tone adaptation
 */
(function (window) {
  'use strict';

  let currentTargetInput = null;
  let currentTone = 'executive';
  let currentCelebrant = '';
  let currentOccasion = 'birthday';

  // Create and inject modal DOM
  function createWizardModal() {
    if (document.getElementById('ai-warmth-wizard-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'ai-warmth-wizard-modal';
    modal.className = 'ai-wizard-modal-overlay';
    modal.innerHTML = `
      <div class="ai-wizard-modal-card">
        <button id="ai-wizard-close-btn" class="modal-close-btn" title="Close Wizard">✕</button>
        
        <div class="ai-wizard-header">
          <div class="pill-badge-3d" style="margin-bottom: 8px;">
            <span>✨ AI WARMTH WIZARD</span>
          </div>
          <h2 class="ai-wizard-title">Craft a Heartfelt Celebration Wish</h2>
          <p class="ai-wizard-subtitle">Generate tailored, authentic celebration notes tailored to your colleague.</p>
        </div>

        <!-- Tone Selector Pills -->
        <div class="ai-wizard-tones-grid">
          <button type="button" class="ai-tone-pill active" data-tone="executive">
            <span class="tone-icon">👔</span>
            <span class="tone-label">Executive & Warm</span>
          </button>
          <button type="button" class="ai-tone-pill" data-tone="playful">
            <span class="tone-icon">🎈</span>
            <span class="tone-label">Fun & Playful</span>
          </button>
          <button type="button" class="ai-tone-pill" data-tone="inspiring">
            <span class="tone-icon">🚀</span>
            <span class="tone-label">Inspiring & Bold</span>
          </button>
          <button type="button" class="ai-tone-pill" data-tone="zen">
            <span class="tone-icon">🕊️</span>
            <span class="tone-label">Poetic & Zen</span>
          </button>
        </div>

        <!-- Custom Recipient Name & Occasion Row -->
        <div class="ai-wizard-meta-row">
          <div style="flex: 1;">
            <label class="ai-wizard-label">Recipient Name</label>
            <input type="text" id="ai-wizard-name-input" placeholder="Enter recipient name..." class="ai-wizard-input">
          </div>
          <div style="flex: 1;">
            <label class="ai-wizard-label">Occasion</label>
            <select id="ai-wizard-occasion-select" class="ai-wizard-input">
              <option value="birthday">🎂 Birthday</option>
              <option value="anniversary">🏆 Work Anniversary</option>
              <option value="milestone">🌟 Leadership Milestone</option>
            </select>
          </div>
        </div>

        <!-- Generated Wish Output Box -->
        <div class="ai-wizard-result-box">
          <div class="ai-wizard-result-badge">
            <span id="ai-result-tone-tag">✨ Executive Tone</span>
            <button type="button" id="ai-wizard-shuffle-btn" class="ai-wizard-icon-btn" title="Generate Another Variation">
              🔄 Shuffle
            </button>
          </div>
          <p id="ai-wizard-text" class="ai-wizard-text">Click "Generate Heartfelt Wish" to craft a personalized message...</p>
        </div>

        <!-- Action Controls -->
        <div class="ai-wizard-actions">
          <button type="button" id="ai-wizard-generate-btn" class="btn-primary-action" style="padding: 12px 24px;">
            <span>✨ Generate Wish</span>
          </button>
          <button type="button" id="ai-wizard-insert-btn" class="btn-primary" style="padding: 12px 24px; background: linear-gradient(135deg, #10B981, #059669); border: none;">
            <span>✅ Insert into Message</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event Listeners
    const closeBtn = document.getElementById('ai-wizard-close-btn');
    closeBtn.addEventListener('click', () => closeWizard());

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeWizard();
    });

    // Tone Pills
    const tonePills = modal.querySelectorAll('.ai-tone-pill');
    tonePills.forEach(pill => {
      pill.addEventListener('click', () => {
        tonePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentTone = pill.getAttribute('data-tone');
        document.getElementById('ai-result-tone-tag').textContent = `✨ ${pill.querySelector('.tone-label').textContent}`;
        generateWish();
      });
    });

    // Generate & Shuffle
    const genBtn = document.getElementById('ai-wizard-generate-btn');
    const shuffleBtn = document.getElementById('ai-wizard-shuffle-btn');
    genBtn.addEventListener('click', () => generateWish());
    shuffleBtn.addEventListener('click', () => generateWish());

    // Insert Button
    const insertBtn = document.getElementById('ai-wizard-insert-btn');
    insertBtn.addEventListener('click', () => {
      const wishText = document.getElementById('ai-wizard-text').textContent;
      if (currentTargetInput && wishText && !wishText.startsWith('Click "Generate')) {
        if (typeof currentTargetInput === 'function') {
          currentTargetInput(wishText);
        } else if (currentTargetInput.value !== undefined) {
          currentTargetInput.value = wishText;
          currentTargetInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else {
        // Copy to clipboard
        navigator.clipboard.writeText(wishText);
        closeWizard();
        if (window.showZenitudeNotification) {
          window.showZenitudeNotification({
            title: 'Wish Copied!',
            message: 'Your personalized celebratory wish has been copied to your clipboard.',
            icon: '✨',
            type: 'success'
          });
        }
      }
    });
  }

  async function generateWish() {
    const nameInput = document.getElementById('ai-wizard-name-input');
    const occasionSelect = document.getElementById('ai-wizard-occasion-select');
    const textBox = document.getElementById('ai-wizard-text');

    const name = (nameInput?.value || currentCelebrant || 'Colleague').trim();
    const occasion = occasionSelect?.value || currentOccasion || 'birthday';

    textBox.style.opacity = '0.5';
    textBox.textContent = '✨ Crafting thoughtful message with Zenitude Intelligence...';

    try {
      const res = await fetch('/api/ai/generate-wish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, tone: currentTone, occasion })
      });

      if (res.ok) {
        const data = await res.json();
        textBox.textContent = data.wish;
      } else {
        throw new Error('Fallback to local generator');
      }
    } catch (err) {
      // Offline fallback
      textBox.textContent = `Happy ${occasion === 'anniversary' ? 'Work Anniversary' : 'Birthday'}, ${name}! Wishing you continuous breakthroughs, profound fulfillment, and heartfelt celebration with our workspace circle today.`;
    } finally {
      textBox.style.opacity = '1';
    }
  }

  function openWizard(options = {}) {
    createWizardModal();
    currentTargetInput = options.targetInput || null;
    currentCelebrant = options.name || '';
    currentOccasion = options.occasion || 'birthday';

    const nameInput = document.getElementById('ai-wizard-name-input');
    const occasionSelect = document.getElementById('ai-wizard-occasion-select');
    if (nameInput && options.name) nameInput.value = options.name;
    if (occasionSelect && options.occasion) occasionSelect.value = options.occasion;

    const modal = document.getElementById('ai-warmth-wizard-modal');
    if (modal) {
      modal.classList.add('active');
      generateWish();
    }
  }

  function closeWizard() {
    const modal = document.getElementById('ai-warmth-wizard-modal');
    if (modal) modal.classList.remove('active');
  }

  // Export to global window
  window.AIWarmthWizard = {
    open: openWizard,
    close: closeWizard,
    generate: generateWish
  };

})(window);
