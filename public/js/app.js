document.addEventListener('DOMContentLoaded', () => {
  let birthdays = [];
  let soundEnabled = true;
  let activeWishRecipient = null;
  let countdownInterval = null;

  // DOM Elements
  const todaySection = document.getElementById('today-section');
  const todayContainer = document.getElementById('today-container');
  const cardsContainer = document.getElementById('cards-container');
  const emptyState = document.getElementById('upcoming-empty-state');
  const navbar = document.getElementById('navbar');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');

  // Theme Management (Light / Dark Sunset)
  const savedTheme = localStorage.getItem('zenitude_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (themeToggleBtn) {
    themeToggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('zenitude_theme', next);
      themeToggleBtn.textContent = next === 'dark' ? '☀️' : '🌙';
    });
  }

  // Celebration Overlay Elements
  const celebrationOverlay = document.getElementById('celebration-overlay');
  const celebrationClose = document.getElementById('celebration-close');
  const confettiCanvas = document.getElementById('confetti-canvas');
  const celebrationPhoto = document.getElementById('celebration-photo');
  const celebrationName = document.getElementById('celebration-name');
  const celebrationZodiac = document.getElementById('celebration-zodiac');
  const celebrationWishText = document.getElementById('celebration-wish-text');
  const burstConfettiBtn = document.getElementById('burst-confetti-btn');
  const celebrationWishBtn = document.getElementById('celebration-wish-btn');
  const emojiBurst = document.getElementById('emoji-burst');

  // Interactive Cake Game Elements
  const interactiveCake = document.getElementById('interactive-cake');
  const cakeHint = document.getElementById('cake-hint');
  let cakeCandlesBlown = false;

  // Wish Modal Elements
  const wishModal = document.getElementById('wish-modal');
  const wishModalClose = document.getElementById('wish-modal-close');
  const wishRecipientName = document.getElementById('wish-recipient-name');
  const wishCustomText = document.getElementById('wish-custom-text');
  const wishTabs = document.querySelectorAll('.wish-tab');
  const copyWishBtn = document.getElementById('copy-wish-btn');
  const downloadCardBtn = document.getElementById('download-card-btn');
  const postChatWishBtn = document.getElementById('post-chat-wish-btn');
  const wishCopyFeedback = document.getElementById('wish-copy-feedback');

  // Vibrant Gradient Palette for Profile Avatars
  const AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #FF6B6B, #FF8E53)', // Coral Sunrise
    'linear-gradient(135deg, #4ECDC4, #2C3E50)', // Teal Ocean
    'linear-gradient(135deg, #A78BFA, #F472B6)', // Purple Blossom
    'linear-gradient(135deg, #F59E0B, #EF4444)', // Amber Flame
    'linear-gradient(135deg, #10B981, #059669)', // Emerald Jade
    'linear-gradient(135deg, #6366F1, #8B5CF6)', // Indigo Dream
    'linear-gradient(135deg, #EC4899, #8B5CF6)', // Berry Bloom
    'linear-gradient(135deg, #06B6D4, #3B82F6)', // Cyan Blue
    'linear-gradient(135deg, #F43F5E, #FB7185)', // Rose Spark
    'linear-gradient(135deg, #14B8A6, #0D9488)'  // Ocean Mint
  ];

  function getAvatarGradient(name) {
    if (!name) return AVATAR_GRADIENTS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[index];
  }

  // Intersection Observer for scroll entrance
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });

  // Sound toggle
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundToggleBtn.textContent = soundEnabled ? '🔔' : '🔕';
      soundToggleBtn.title = soundEnabled ? 'Celebration sounds enabled' : 'Celebration sounds muted';
    });
  }

  // Celebration close & action buttons
  if (celebrationClose) celebrationClose.addEventListener('click', closeCelebration);
  if (celebrationOverlay) {
    celebrationOverlay.addEventListener('click', (e) => {
      if (e.target === celebrationOverlay) closeCelebration();
    });
  }

  if (burstConfettiBtn) {
    burstConfettiBtn.addEventListener('click', (e) => {
      const rect = burstConfettiBtn.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;

      triggerCelebrationChime();
      startEmojiBurst();
      popAdditionalConfetti(originX, originY);
      popAdditionalConfetti(window.innerWidth / 2, window.innerHeight / 2);
      showUserToast('🎉 Confetti Popped! Celebrate!', 'success');
    });
  }

  if (celebrationWishBtn) {
    celebrationWishBtn.addEventListener('click', () => {
      closeCelebration();
      if (activeWishRecipient) openWishModal(activeWishRecipient);
    });
  }

  // Interactive Cake: Blow out candles game
  if (interactiveCake) {
    interactiveCake.addEventListener('click', () => {
      if (cakeCandlesBlown) return;
      cakeCandlesBlown = true;
      
      const flames = document.querySelectorAll('.flame');
      flames.forEach(f => f.classList.add('extinguished'));

      if (cakeHint) {
        cakeHint.innerHTML = '✨ <strong>Wish Granted! Happy Birthday!</strong> 🥳';
        cakeHint.style.background = 'rgba(78, 205, 196, 0.2)';
        cakeHint.style.color = '#0D9488';
      }

      startEmojiBurst();
      popAdditionalConfetti();
      triggerCelebrationChime();
      showUserToast('Candles blown out! May all your wishes come true! 🎂✨', 'success');
    });
  }

  // Wish modal close
  if (wishModalClose) wishModalClose.addEventListener('click', closeWishModal);
  if (wishModal) {
    wishModal.addEventListener('click', (e) => {
      if (e.target === wishModal) closeWishModal();
    });
  }

  // Wish categories
  wishTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      wishTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (activeWishRecipient) {
        wishCustomText.value = getWishMessage(activeWishRecipient.name, tab.dataset.cat);
      }
    });
  });

  // Copy wish button
  if (copyWishBtn) {
    copyWishBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(wishCustomText.value);
        wishCopyFeedback.classList.remove('hidden');
        setTimeout(() => wishCopyFeedback.classList.add('hidden'), 2500);
      } catch (err) {
        wishCustomText.select();
        document.execCommand('copy');
        wishCopyFeedback.classList.remove('hidden');
        setTimeout(() => wishCopyFeedback.classList.add('hidden'), 2500);
      }
    });
  }

  // Download Greeting Card button
  if (downloadCardBtn) {
    downloadCardBtn.addEventListener('click', () => {
      if (!activeWishRecipient) return;
      generateAndDownloadCard(activeWishRecipient.name, wishCustomText.value);
    });
  }

  // Post to Circle Chat button (Navigates to /chat with message pre-filled)
  if (postChatWishBtn) {
    postChatWishBtn.addEventListener('click', () => {
      if (!activeWishRecipient) return;
      const recipient = encodeURIComponent(activeWishRecipient.name);
      const message = encodeURIComponent(wishCustomText.value);
      window.location.href = `/chat?recipient=${recipient}&message=${message}`;
    });
  }

  init();

  async function init() {
    await fetchBirthdays();
    renderTodaysBirthdays();
    renderUpcomingTwoCards();
    initAmbientBalloons();
  }

  async function fetchBirthdays() {
    try {
      const response = await fetch('/api/birthdays');
      if (response.ok) {
        birthdays = await response.json();
      } else {
        birthdays = [];
      }
    } catch (error) {
      console.warn('Could not fetch birthdays from API', error);
      birthdays = [];
    }
    birthdays.sort((a, b) => a.days_until - b.days_until);
  }

  // ===== TODAY'S BIRTHDAYS =====
  function renderTodaysBirthdays() {
    const todayBdays = birthdays.filter(b => b.days_until === 0);
    if (todayBdays.length === 0) {
      todaySection.classList.add('hidden');
      return;
    }

    todaySection.classList.remove('hidden');
    todayContainer.innerHTML = '';

    const wishes = [
      "May this special day bring you endless joy, laughter, and wonderful memories! 🌟",
      "Wishing you a year filled with grand adventures and brilliant smiles! ✨",
      "May your day be as wonderful and radiant as you are! 💖",
      "Cheers to another fantastic chapter of your life! 🥳"
    ];

    todayBdays.forEach((bday, index) => {
      const card = document.createElement('div');
      card.className = 'today-card';
      card.style.animationDelay = `${index * 0.15}s`;

      const avatarGrad = getAvatarGradient(bday.name);
      const photoHtml = bday.photo
        ? `<div class="today-photo"><img src="${bday.photo}" alt="${bday.name}"></div>`
        : `<div class="today-photo" style="background: ${avatarGrad}; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">${getInitials(bday.name)}</div>`;

      const wish = wishes[index % wishes.length];

      card.innerHTML = `
        <div class="today-mini-confetti">${generateMiniConfetti()}</div>
        ${photoHtml}
        <div class="today-name">${bday.name}</div>
        <div class="today-label">🎂 Birthday Today!</div>
        <div class="today-wish">"${wish}"</div>
        <button type="button" class="today-btn-wish" data-action="wish">💌 Send Birthday Wish</button>
      `;

      card.querySelector('[data-action="wish"]').addEventListener('click', (e) => {
        e.stopPropagation();
        openWishModal(bday);
      });

      card.addEventListener('click', () => openCelebration(bday));
      todayContainer.appendChild(card);
    });

    // Auto-trigger celebration for first today celebrant after 1.2s
    setTimeout(() => {
      openCelebration(todayBdays[0]);
    }, 1200);
  }

  function generateMiniConfetti() {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#A78BFA', '#F472B6', '#34D399'];
    let html = '';
    for (let i = 0; i < 12; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const delay = Math.random() * 3.5;
      const top = 65 + Math.random() * 35;
      html += `<div class="mini-dot" style="left:${left}%;top:${top}%;background:${color};animation-delay:${delay}s;"></div>`;
    }
    return html;
  }

  // ===== ONLY 2 PERSONS OF UPCOMING BIRTHDAY =====
  function renderUpcomingTwoCards() {
    cardsContainer.innerHTML = '';
    if (countdownInterval) clearInterval(countdownInterval);

    // Show the next 2 future upcoming birthdays (days_until > 0)
    // If none in future, fallback to all available birthdays
    const futureBirthdays = birthdays.filter(b => b.days_until > 0);
    const upcomingTwo = futureBirthdays.length > 0 ? futureBirthdays.slice(0, 2) : birthdays.slice(0, 2);

    if (upcomingTwo.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    upcomingTwo.forEach((bday, index) => {
      const card = document.createElement('div');
      card.className = 'birthday-card-featured';
      if (bday.days_until === 0) card.classList.add('is-today');
      card.style.animationDelay = `${index * 0.12}s`;

      const isToday = bday.days_until === 0;
      const isTomorrow = bday.days_until === 1;

      let badgeText;
      let badgeClass = '';
      if (isToday) {
        badgeText = '🎂 Today!';
        badgeClass = 'badge-today';
      } else if (isTomorrow) {
        badgeText = '⏰ Tomorrow!';
        badgeClass = 'badge-soon';
      } else if (bday.days_until <= 7) {
        badgeText = `⏳ In ${bday.days_until} days`;
        badgeClass = 'badge-soon';
      } else {
        badgeText = `In ${bday.days_until} days`;
      }

      const avatarGrad = getAvatarGradient(bday.name);
      const photoHtml = bday.photo
        ? `<div class="card-photo-large"><img src="${bday.photo}" alt="${bday.name}"></div>`
        : `<div class="card-photo-large" style="background: ${avatarGrad}; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">${getInitials(bday.name)}</div>`;

      const zodiac = getZodiacSign(bday.date);
      const gcalLink = getGoogleCalendarUrl(bday);

      // Countdown Widget only on the top upcoming birthday
      const countdownHtml = (index === 0 && bday.days_until > 0) ? `
        <div class="countdown-widget" id="top-upcoming-countdown">
          <div class="countdown-label-left">⏳ <span>Live Countdown</span></div>
          <div class="countdown-clock">
            <div class="countdown-unit"><span class="countdown-num" id="cd-days">00</span><span class="countdown-tag">Days</span></div>
            <span class="countdown-sep">:</span>
            <div class="countdown-unit"><span class="countdown-num" id="cd-hours">00</span><span class="countdown-tag">Hrs</span></div>
            <span class="countdown-sep">:</span>
            <div class="countdown-unit"><span class="countdown-num" id="cd-mins">00</span><span class="countdown-tag">Min</span></div>
            <span class="countdown-sep">:</span>
            <div class="countdown-unit"><span class="countdown-num" id="cd-secs">00</span><span class="countdown-tag">Sec</span></div>
          </div>
        </div>
      ` : '';

      card.innerHTML = `
        <div class="card-badge ${badgeClass}">${badgeText}</div>
        
        <div class="card-featured-header">
          ${photoHtml}
          <div class="card-featured-info">
            <h3 class="card-name-large">${bday.name}</h3>
            <div class="card-date-large">🗓️ ${formatDate(bday.date)}</div>
            <div class="zodiac-tag">${zodiac.symbol} ${zodiac.name}</div>
          </div>
        </div>

        ${countdownHtml}

        <div class="card-featured-actions">
          <a href="${gcalLink}" target="_blank" rel="noopener" class="btn-card-action btn-calendar-action" title="Add to Google Calendar">
            <span>📅 Remind</span>
          </a>
          <button type="button" class="btn-card-action btn-wish-action-card" data-action="wish" title="Send a Wish">
            <span>💌 Send Wish</span>
          </button>
        </div>
      `;

      // Wish button click
      card.querySelector('[data-action="wish"]').addEventListener('click', (e) => {
        e.stopPropagation();
        openWishModal(bday);
      });

      if (isToday) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => openCelebration(bday));
      }

      cardsContainer.appendChild(card);
      observer.observe(card);

      // Start live countdown ticker if this is the top card
      if (index === 0 && bday.days_until > 0) {
        startCountdownTicker(bday.date);
      }
    });
  }

  // ===== LIVE COUNTDOWN TICKER =====
  function startCountdownTicker(dateStr) {
    const [m, d] = dateStr.split('-').map(Number);
    const now = new Date();
    let targetYear = now.getFullYear();
    let targetDate = new Date(targetYear, m - 1, d, 0, 0, 0);

    if (targetDate.getTime() < now.getTime()) {
      targetYear++;
      targetDate = new Date(targetYear, m - 1, d, 0, 0, 0);
    }

    function update() {
      const current = new Date().getTime();
      const diff = targetDate.getTime() - current;

      if (diff <= 0) {
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const dEl = document.getElementById('cd-days');
      const hEl = document.getElementById('cd-hours');
      const mEl = document.getElementById('cd-mins');
      const sEl = document.getElementById('cd-secs');

      if (dEl) dEl.textContent = String(days).padStart(2, '0');
      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(mins).padStart(2, '0');
      if (sEl) sEl.textContent = String(secs).padStart(2, '0');
    }

    update();
    countdownInterval = setInterval(update, 1000);
  }

  // ===== CELEBRATION OVERLAY =====
  function openCelebration(bday) {
    if (!celebrationOverlay) return;
    activeWishRecipient = bday;
    cakeCandlesBlown = false;

    // Reset cake state
    const flames = document.querySelectorAll('.flame');
    flames.forEach(f => f.classList.remove('extinguished'));
    if (cakeHint) {
      cakeHint.innerHTML = '👆 Tap candles to make a wish & blow them out!';
      cakeHint.style.background = 'rgba(255, 107, 107, 0.1)';
      cakeHint.style.color = 'var(--primary)';
    }

    if (bday.photo) {
      celebrationPhoto.innerHTML = `<img src="${bday.photo}" alt="${bday.name}">`;
      celebrationPhoto.style.background = '';
    } else {
      celebrationPhoto.innerHTML = getInitials(bday.name);
      celebrationPhoto.style.background = getAvatarGradient(bday.name);
      celebrationPhoto.style.color = 'white';
      celebrationPhoto.style.textShadow = '0 2px 4px rgba(0,0,0,0.3)';
    }

    celebrationName.textContent = bday.name;
    const zodiac = getZodiacSign(bday.date);
    celebrationZodiac.textContent = `${zodiac.symbol} ${zodiac.name} · ${formatDate(bday.date)}`;

    const customWishes = [
      `"Wishing you a magnificent birthday, ${bday.name}! May all your dreams take flight this year!" 🌟`,
      `"May your day be filled with warm smiles, loving moments, and all your favorite treats!" 🎂`,
      `"Cheers to another fabulous year of greatness, laughter, and success!" 🥳`
    ];
    celebrationWishText.textContent = customWishes[Math.floor(Math.random() * customWishes.length)];

    celebrationOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    triggerCelebrationChime();
    startConfettiCanvas();
    startEmojiBurst();
  }

  function closeCelebration() {
    if (!celebrationOverlay) return;
    celebrationOverlay.classList.add('hidden');
    document.body.style.overflow = '';
    stopConfetti();
  }

  // ===== WISH GENERATOR MODAL =====
  function openWishModal(bday) {
    activeWishRecipient = bday;
    wishRecipientName.textContent = bday.name;
    wishTabs.forEach(t => t.classList.remove('active'));
    wishTabs[0].classList.add('active'); // default sweet
    wishCustomText.value = getWishMessage(bday.name, 'sweet');
    wishCopyFeedback.classList.add('hidden');
    wishModal.classList.remove('hidden');
  }

  function closeWishModal() {
    if (wishModal) wishModal.classList.add('hidden');
  }

  function getWishMessage(name, category) {
    const templates = {
      sweet: `Happy Birthday, ${name}! 🎂 Wishing you a day as special and wonderful as you are. May this year bring you endless happiness, good health, and big smiles! 💖✨`,
      funny: `Happy Birthday, ${name}! 🎉 Another year older, but definitely not any wiser! 😉 Enjoy the cake and make the most of your special day! 🍰🎈`,
      inspirational: `Wishing you a truly inspiring and blessed birthday, ${name}! 🌟 May every step you take this year lead to success, peace, and fulfilled dreams. Cheers to your journey! 🥂`,
      short: `Happy Birthday ${name}! 🎉 Wishing you all the best today and always! 🎂✨`
    };
    return templates[category] || templates.sweet;
  }

  // ===== GENERATE AND DOWNLOAD GREETING CARD (Canvas PNG) =====
  function generateAndDownloadCard(name, wishText) {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');

    // Background Luxury Gradient
    const grad = ctx.createLinearGradient(0, 0, 1000, 1000);
    grad.addColorStop(0, '#FFF5F5');
    grad.addColorStop(0.3, '#FFEAEA');
    grad.addColorStop(0.7, '#FFF0DB');
    grad.addColorStop(1, '#E8F5FF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1000, 1000);

    // Decorative Borders
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 4;
    ctx.strokeRect(35, 35, 930, 930);

    ctx.strokeStyle = '#FFD93D';
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 45, 910, 910);

    // Header Icons
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ 🎂 ✨', 500, 130);

    // Title
    ctx.fillStyle = '#1A1A2E';
    ctx.font = 'bold 54px serif';
    ctx.fillText('Happy Birthday!', 500, 220);

    // Celebrant Name with Gradient Effect
    ctx.fillStyle = '#FF6B6B';
    ctx.font = 'bold 64px serif';
    ctx.fillText(name, 500, 310);

    // Divider Line
    ctx.beginPath();
    ctx.moveTo(380, 360);
    ctx.lineTo(620, 360);
    ctx.strokeStyle = '#4ECDC4';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Quoted Wish Message
    ctx.fillStyle = '#2D3436';
    ctx.font = 'italic 34px sans-serif';
    wrapText(ctx, `"${wishText}"`, 500, 460, 800, 50);

    // Bottom Decorative Icons
    ctx.font = '36px sans-serif';
    ctx.fillText('🎈 🥂 🎉', 500, 820);

    // Footer Watermark
    ctx.fillStyle = '#636E72';
    ctx.font = '600 22px sans-serif';
    ctx.fillText('CELEBRATED WITH ZENITUDE', 500, 880);

    // Download PNG
    const link = document.createElement('a');
    link.download = `Zenitude-Birthday-Card-${name.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showUserToast('Greeting card generated & downloaded! 📸✨', 'success');
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  // ===== AMBIENT FLOATING BALLOONS =====
  function initAmbientBalloons() {
    const container = document.getElementById('ambient-balloons-container');
    if (!container) return;

    const balloonEmojis = ['🎈', '💖', '🎂', '✨', '🌟', '🎁', '🍰', '🌸'];

    setInterval(() => {
      // Spawn occasionally
      if (document.hidden) return;
      if (container.children.length > 6) return;

      const balloon = document.createElement('div');
      balloon.className = 'ambient-balloon';
      balloon.textContent = balloonEmojis[Math.floor(Math.random() * balloonEmojis.length)];
      balloon.style.left = Math.random() * 90 + 5 + '%';
      const speed = (12 + Math.random() * 6).toFixed(1) + 's';
      balloon.style.setProperty('--speed', speed);

      // Pop on click
      balloon.addEventListener('click', () => {
        balloon.classList.add('balloon-popped');
        triggerCelebrationChime();
        setTimeout(() => balloon.remove(), 250);
      });

      container.appendChild(balloon);

      // Auto remove after float animation finishes
      setTimeout(() => {
        if (balloon.parentNode) balloon.remove();
      }, 19000);
    }, 4500);
  }

  // ===== CONFETTI CANVAS & CANNON PHYSICS =====
  let confettiPieces = [];
  let confettiAnimId = null;

  function resizeConfettiCanvas() {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeConfettiCanvas);

  function startConfettiCanvas() {
    const canvas = confettiCanvas;
    if (!canvas) return;
    resizeConfettiCanvas();

    confettiPieces = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#A78BFA', '#F472B6', '#34D399', '#FF8E53', '#6C63FF', '#F59E0B'];

    // Initial ambient falling confetti
    for (let i = 0; i < 100; i++) {
      confettiPieces.push({
        type: 'ambient',
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 3 + 2,
        w: Math.random() * 10 + 6,
        h: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.4 + 0.6
      });
    }

    if (!confettiAnimId) {
      animateConfetti();
    }
  }

  function popAdditionalConfetti(originX, originY) {
    const canvas = confettiCanvas;
    if (!canvas) return;
    resizeConfettiCanvas();

    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#A78BFA', '#F472B6', '#34D399', '#FF8E53', '#6C63FF', '#F43F5E', '#10B981'];
    const startX = (originX !== undefined && !isNaN(originX)) ? originX : canvas.width / 2;
    const startY = (originY !== undefined && !isNaN(originY)) ? originY : canvas.height / 2;

    // Explode 90 particles outward with physics velocity
    for (let i = 0; i < 90; i++) {
      const angle = (Math.PI * 2 * i) / 90 + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 16 + 8;
      confettiPieces.push({
        type: 'burst',
        x: startX + (Math.random() - 0.5) * 20,
        y: startY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        gravity: 0.38,
        drag: 0.95,
        w: Math.random() * 12 + 6,
        h: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.4,
        opacity: 1,
        life: 1.0,
        decay: Math.random() * 0.012 + 0.008
      });
    }

    if (!confettiAnimId) {
      animateConfetti();
    }
  }

  function animateConfetti() {
    const canvas = confettiCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = confettiPieces.length - 1; i >= 0; i--) {
        const p = confettiPieces[i];

        if (p.type === 'burst') {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= p.drag;
          p.vy *= p.drag;
          p.vy += p.gravity;
          p.angle += p.spin;
          p.life -= p.decay;
          p.opacity = Math.max(0, p.life);

          if (p.life <= 0 || p.y > canvas.height + 30) {
            confettiPieces.splice(i, 1);
            continue;
          }
        } else {
          // Ambient falling
          p.y += p.vy;
          p.x += p.vx;
          p.angle += p.spin;

          if (p.y > canvas.height + 20) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
          }
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (confettiPieces.length > 0) {
        confettiAnimId = requestAnimationFrame(loop);
      } else {
        confettiAnimId = null;
      }
    }

    loop();
  }

  function stopConfetti() {
    if (confettiAnimId) {
      cancelAnimationFrame(confettiAnimId);
      confettiAnimId = null;
    }
    confettiPieces = [];
    if (confettiCanvas) {
      const ctx = confettiCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  function startEmojiBurst() {
    if (!emojiBurst) return;
    emojiBurst.innerHTML = '';
    const emojis = ['🎂', '🎉', '🎊', '🥳', '🎈', '🎁', '✨', '💖', '🌟', '🍰'];

    for (let i = 0; i < 18; i++) {
      setTimeout(() => {
        const el = document.createElement('span');
        el.className = 'emoji-particle';
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.left = Math.random() * 95 + '%';
        el.style.animationDuration = (3 + Math.random() * 2) + 's';
        el.style.fontSize = (1.3 + Math.random() * 1.3) + 'rem';
        emojiBurst.appendChild(el);
        setTimeout(() => el.remove(), 5000);
      }, i * 160);
    }
  }

  // ===== CELEBRATION CHIME (Web Audio API) =====
  function triggerCelebrationChime() {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (C Major Arpeggio)
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + idx * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.65);
      });
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  }

  // ===== UTILITIES =====
  function formatDate(dateStr) {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [m, d] = dateStr.split('-');
    const date = new Date(2000, parseInt(m, 10) - 1, parseInt(d, 10));
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }

  function getInitials(name) {
    if (!name) return '🎂';
    const parts = name.trim().split(' ').filter(n => n.length > 0);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function getZodiacSign(dateStr) {
    if (!dateStr || !dateStr.includes('-')) return { name: 'Star', symbol: '✨' };
    const [m, d] = dateStr.split('-').map(Number);
    const zodiacs = [
      { name: 'Capricorn', symbol: '♑', endMonth: 1, endDay: 19 },
      { name: 'Aquarius', symbol: '♒', endMonth: 2, endDay: 18 },
      { name: 'Pisces', symbol: '♓', endMonth: 3, endDay: 20 },
      { name: 'Aries', symbol: '♈', endMonth: 4, endDay: 19 },
      { name: 'Taurus', symbol: '♉', endMonth: 5, endDay: 20 },
      { name: 'Gemini', symbol: '♊', endMonth: 6, endDay: 20 },
      { name: 'Cancer', symbol: '♋', endMonth: 7, endDay: 22 },
      { name: 'Leo', symbol: '♌', endMonth: 8, endDay: 22 },
      { name: 'Virgo', symbol: '♍', endMonth: 9, endDay: 22 },
      { name: 'Libra', symbol: '♎', endMonth: 10, endDay: 22 },
      { name: 'Scorpio', symbol: '♏', endMonth: 11, endDay: 21 },
      { name: 'Sagittarius', symbol: '♐', endMonth: 12, endDay: 21 },
      { name: 'Capricorn', symbol: '♑', endMonth: 12, endDay: 31 }
    ];

    for (const z of zodiacs) {
      if (m < z.endMonth || (m === z.endMonth && d <= z.endDay)) {
        return z;
      }
    }
    return { name: 'Capricorn', symbol: '♑' };
  }

  function getGoogleCalendarUrl(bday) {
    const now = new Date();
    const [m, d] = bday.date.split('-').map(Number);
    let targetYear = now.getFullYear();
    const bdayDate = new Date(targetYear, m - 1, d);
    if (bdayDate < now && bday.days_until > 0) {
      targetYear++;
    }
    const yearStr = targetYear.toString();
    const monthStr = String(m).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const dateFormatted = `${yearStr}${monthStr}${dayStr}`;

    const title = encodeURIComponent(`🎂 Birthday: ${bday.name}`);
    const details = encodeURIComponent(`Don't forget to wish ${bday.name} a very Happy Birthday! 🎉 Sent from Zenitude.`);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateFormatted}/${dateFormatted}&details=${details}`;
  }

  function showUserToast(message, type = 'info') {
    let container = document.getElementById('user-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'user-toast-container';
      container.className = 'user-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `user-toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
});
