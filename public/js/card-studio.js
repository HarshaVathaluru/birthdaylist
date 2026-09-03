/**
 * Zenitude.ai — Luxury Digital Greeting Card & VIP Letterhead Studio
 * High-definition Canvas Rendering, Luxury Foil Themes, and 1-Click Export Engine
 */
(function (window) {
  'use strict';

  let currentCardData = {
    name: 'Celebrant',
    occasion: 'Birthday Celebration',
    badge: 'VIP EXECUTIVE LETTERHEAD',
    message: 'On behalf of our entire workspace circle, wishing you an extraordinary birthday and continued distinction in all your endeavors.',
    author: 'Zenitude.ai Workspace Circle',
    theme: 'obsidian',
    seal: 'gold'
  };

  const THEMES = {
    obsidian: {
      name: 'Obsidian & 24K Gold',
      bgGradient: ['#0B0F19', '#1E293B'],
      border: '#D97706',
      accent: '#F59E0B',
      textMain: '#FFFFFF',
      textMuted: '#94A3B8',
      sealColor: '#F59E0B',
      cardTag: '24K EXECUTIVE GOLD'
    },
    sunset: {
      name: 'Sunset Amber & Rose Gold',
      bgGradient: ['#FFF7ED', '#FFEDD5'],
      border: '#EA580C',
      accent: '#EA580C',
      textMain: '#0F172A',
      textMuted: '#64748B',
      sealColor: '#EA580C',
      cardTag: 'SUNSET RADIANCE'
    },
    emerald: {
      name: 'Emerald Velvet & Silver',
      bgGradient: ['#064E3B', '#022C22'],
      border: '#10B981',
      accent: '#34D399',
      textMain: '#FFFFFF',
      textMuted: '#A7F3D0',
      sealColor: '#10B981',
      cardTag: 'DISTINGUISHED HERITAGE'
    },
    cosmic: {
      name: 'Midnight Nebula & Amethyst',
      bgGradient: ['#1E1B4B', '#0F172A'],
      border: '#8B5CF6',
      accent: '#C084FC',
      textMain: '#FFFFFF',
      textMuted: '#CBD5E1',
      sealColor: '#A855F7',
      cardTag: 'COSMIC INSPIRATION'
    }
  };

  function createStudioModal() {
    if (document.getElementById('card-studio-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'card-studio-modal';
    modal.className = 'studio-modal-overlay';
    modal.innerHTML = `
      <div class="studio-modal-card">
        <button id="card-studio-close-btn" class="modal-close-btn" title="Close Studio">✕</button>

        <div class="studio-header">
          <div class="pill-badge-3d" style="margin-bottom: 8px;">
            <span>🎨 LUXURY GREETING CARD STUDIO</span>
          </div>
          <h2 class="studio-title">Design VIP Celebration Letterhead</h2>
          <p class="studio-subtitle">Customize, download, or broadcast high-resolution luxury digital cards.</p>
        </div>

        <div class="studio-workspace-grid">
          
          <!-- Left: Live Interactive Canvas Preview -->
          <div class="studio-preview-col">
            <div class="canvas-card-wrapper">
              <canvas id="luxury-card-canvas" width="1200" height="800"></canvas>
            </div>
            <div class="studio-canvas-actions">
              <button type="button" id="download-card-png-btn" class="btn-card-action-png" title="Download High-Res PNG">
                <span>⬇️ Download PNG</span>
              </button>
              <button type="button" id="copy-card-img-btn" class="btn-card-action-copy" title="Copy to Clipboard">
                <span>📋 Copy Image</span>
              </button>
              <button type="button" id="share-card-chat-btn" class="btn-card-action-chat" title="Post to Circle Chat">
                <span>💬 Post to Chat</span>
              </button>
            </div>
          </div>

          <!-- Right: Interactive Customization Controls -->
          <div class="studio-controls-col">
            
            <!-- Theme Selection -->
            <div class="control-group">
              <label class="control-label">👑 Luxury Material & Theme</label>
              <div class="theme-picker-grid">
                <button type="button" class="theme-picker-btn active" data-theme="obsidian">
                  <span class="theme-swatch" style="background: linear-gradient(135deg, #0B0F19, #D97706);"></span>
                  <span>Obsidian Gold</span>
                </button>
                <button type="button" class="theme-picker-btn" data-theme="sunset">
                  <span class="theme-swatch" style="background: linear-gradient(135deg, #FFEDD5, #EA580C);"></span>
                  <span>Sunset Rose</span>
                </button>
                <button type="button" class="theme-picker-btn" data-theme="emerald">
                  <span class="theme-swatch" style="background: linear-gradient(135deg, #064E3B, #10B981);"></span>
                  <span>Emerald Luxe</span>
                </button>
                <button type="button" class="theme-picker-btn" data-theme="cosmic">
                  <span class="theme-swatch" style="background: linear-gradient(135deg, #1E1B4B, #8B5CF6);"></span>
                  <span>Cosmic Nebula</span>
                </button>
              </div>
            </div>

            <!-- Celebrant Name & Occasion -->
            <div class="control-group-row">
              <div style="flex: 1;">
                <label class="control-label">Celebrant Name</label>
                <input type="text" id="card-name-input" class="studio-input" placeholder="Enter celebrant's name" value="Celebrated Colleague">
              </div>
              <div style="flex: 1;">
                <label class="control-label">Occasion Title</label>
                <input type="text" id="card-occasion-input" class="studio-input" value="Birthday Celebration">
              </div>
            </div>

            <!-- Message with AI Wizard Button -->
            <div class="control-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label class="control-label" style="margin-bottom: 0;">Heartfelt Celebration Message</label>
                <button type="button" id="card-ai-wizard-btn" class="btn-ai-sparkle" title="Generate with AI">
                  <span>✨ AI Warmth Wizard</span>
                </button>
              </div>
              <textarea id="card-message-input" rows="4" class="studio-input" style="resize: vertical;">On behalf of our entire workspace circle, wishing you an extraordinary birthday and continued distinction in all your endeavors.</textarea>
            </div>

            <!-- Sign-off Author -->
            <div class="control-group">
              <label class="control-label">Sign-off / From</label>
              <input type="text" id="card-author-input" class="studio-input" value="Zenitude.ai Workspace Circle">
            </div>

          </div>

        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Bind Event Listeners
    const closeBtn = document.getElementById('card-studio-close-btn');
    closeBtn.addEventListener('click', () => closeStudio());

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeStudio();
    });

    // Theme Switchers
    const themeBtns = modal.querySelectorAll('.theme-picker-btn');
    themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCardData.theme = btn.getAttribute('data-theme');
        renderCardCanvas();
      });
    });

    // Input Bindings
    const nameInput = document.getElementById('card-name-input');
    const occasionInput = document.getElementById('card-occasion-input');
    const messageInput = document.getElementById('card-message-input');
    const authorInput = document.getElementById('card-author-input');

    const updateData = () => {
      currentCardData.name = nameInput.value.trim() || 'Celebrant';
      currentCardData.occasion = occasionInput.value.trim() || 'Celebration';
      currentCardData.message = messageInput.value.trim() || '';
      currentCardData.author = authorInput.value.trim() || 'Workspace Circle';
      renderCardCanvas();
    };

    nameInput.addEventListener('input', updateData);
    occasionInput.addEventListener('input', updateData);
    messageInput.addEventListener('input', updateData);
    authorInput.addEventListener('input', updateData);

    // AI Wizard Integration inside Card Studio
    const aiBtn = document.getElementById('card-ai-wizard-btn');
    aiBtn.addEventListener('click', () => {
      if (window.AIWarmthWizard) {
        window.AIWarmthWizard.open({
          name: nameInput.value,
          occasion: occasionInput.value.toLowerCase().includes('anniversary') ? 'anniversary' : 'birthday',
          targetInput: (generatedText) => {
            messageInput.value = generatedText;
            updateData();
          }
        });
      }
    });

    // Export Controls
    document.getElementById('download-card-png-btn').addEventListener('click', downloadCardPNG);
    document.getElementById('copy-card-img-btn').addEventListener('click', copyCardToClipboard);
    document.getElementById('share-card-chat-btn').addEventListener('click', shareCardToCircleChat);
  }

  // Draw Luxury Card onto HTML5 Canvas
  function renderCardCanvas() {
    const canvas = document.getElementById('luxury-card-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = 1200;
    const h = 800;
    canvas.width = w;
    canvas.height = h;

    const theme = THEMES[currentCardData.theme] || THEMES.obsidian;

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, theme.bgGradient[0]);
    bgGrad.addColorStop(1, theme.bgGradient[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Decorative Ambient Radial Lighting
    const radGlow = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, 600);
    radGlow.addColorStop(0, hexToRgba(theme.accent, 0.15));
    radGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = radGlow;
    ctx.fillRect(0, 0, w, h);

    // 3. Double Luxury Gold / Accent Border with Corner Accents
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, w - 80, h - 80);

    ctx.strokeStyle = hexToRgba(theme.border, 0.4);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(52, 52, w - 104, h - 104);

    // Corner Geometric Diamonds
    drawCornerDiamond(ctx, 40, 40, theme.border);
    drawCornerDiamond(ctx, w - 40, 40, theme.border);
    drawCornerDiamond(ctx, 40, h - 40, theme.border);
    drawCornerDiamond(ctx, w - 40, h - 40, theme.border);

    // 4. Header Badge / Top Stamp
    ctx.textAlign = 'center';
    ctx.font = '700 15px "Inter", sans-serif';
    ctx.fillStyle = theme.accent;
    ctx.letterSpacing = '4px';
    ctx.fillText(`★  ZENITUDE.AI  •  ${theme.cardTag}  ★`, w / 2, 110);

    // 5. Occasion Ribbon Title
    ctx.font = 'italic 22px "Playfair Display", serif';
    ctx.fillStyle = theme.textMuted;
    ctx.fillText(currentCardData.occasion.toUpperCase(), w / 2, 160);

    // 6. Celebrant Name in Grand Serif
    ctx.font = '800 48px "Playfair Display", Georgia, serif';
    ctx.fillStyle = theme.textMain;
    ctx.fillText(currentCardData.name, w / 2, 230);

    // Decorative Separator Line
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 110, 255);
    ctx.lineTo(w / 2 + 110, 255);
    ctx.stroke();

    // 7. Heartfelt Message Body (Word Wrapped)
    ctx.font = '400 22px "Inter", sans-serif';
    ctx.fillStyle = theme.textMain;
    wrapText(ctx, `"${currentCardData.message}"`, w / 2, 330, 920, 36);

    // 8. 24K Gold Foil Wax Seal / Signature Emblem (Bottom Center)
    const sealY = 590;
    drawWaxSeal(ctx, w / 2, sealY, 40, theme.sealColor);

    // 9. Sign-off Footer
    ctx.font = '600 19px "Inter", sans-serif';
    ctx.fillStyle = theme.textMuted;
    ctx.fillText(currentCardData.author, w / 2, 690);

    ctx.font = '400 13px "Inter", sans-serif';
    ctx.fillStyle = hexToRgba(theme.textMuted, 0.6);
    ctx.fillText('Peace of Intelligent Tech  •  Zero Administrative Overhead', w / 2, 720);
  }

  function drawCornerDiamond(ctx, x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x, y + 8);
    ctx.lineTo(x - 8, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawWaxSeal(ctx, x, y, radius, color) {
    ctx.save();
    // Outer Seal scalloped circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 6;
    ctx.fill();

    // Inner Ring
    ctx.beginPath();
    ctx.arc(x, y, radius - 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Central Monogram 'Z'
    ctx.font = 'bold 26px "Playfair Display", serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Z', x, y);
    ctx.restore();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let curY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, curY);
        line = words[n] + ' ';
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, curY);
  }

  function hexToRgba(hex, alpha) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // 1-Click High-Res PNG Download
  function downloadCardPNG() {
    const canvas = document.getElementById('luxury-card-canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `Zenitude_VIP_Card_${currentCardData.name.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  }

  // Copy Image to Clipboard
  async function copyCardToClipboard() {
    const canvas = document.getElementById('luxury-card-canvas');
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        if (window.showZenitudeNotification) {
          window.showZenitudeNotification({
            title: 'Card Copied!',
            message: 'Luxury VIP card copied to clipboard! You can paste it directly into Slack, Teams, or WhatsApp.',
            icon: '📋',
            type: 'success'
          });
        }
      });
    } catch (e) {
      if (window.showZenitudeNotification) {
        window.showZenitudeNotification({
          title: 'Direct Download',
          message: 'Clipboard access not available. Please use the "Download PNG" button.',
          icon: '⬇️',
          type: 'info'
        });
      }
    }
  }

  // Share Card into Circle Chat
  async function shareCardToCircleChat() {
    const canvas = document.getElementById('luxury-card-canvas');
    if (!canvas) return;

    const message = `🌟 VIP Celebration Card generated for **${currentCardData.name}**: "${currentCardData.message}"`;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentCardData.author || 'Zenitude VIP Studio',
          message: message
        })
      });

      if (res.ok) {
        closeStudio();
        if (window.showZenitudeNotification) {
          window.showZenitudeNotification({
            title: 'Card Published!',
            message: `VIP Celebration Card for ${currentCardData.name} has been broadcasted to Circle Chat feed!`,
            icon: '🎉',
            type: 'celebrate'
          });
        }
      }
    } catch (e) {
      if (window.showZenitudeNotification) {
        window.showZenitudeNotification({
          title: 'Broadcast Error',
          message: 'Could not post card to Circle Chat at this moment.',
          icon: '⚠️',
          type: 'warning'
        });
      }
    }
  }

  function openStudio(celebrantName = 'Celebrated Colleague', occasion = 'Birthday Celebration') {
    createStudioModal();
    currentCardData.name = celebrantName;
    currentCardData.occasion = occasion;

    const nameInput = document.getElementById('card-name-input');
    const occasionInput = document.getElementById('card-occasion-input');
    if (nameInput) nameInput.value = celebrantName;
    if (occasionInput) occasionInput.value = occasion;

    const modal = document.getElementById('card-studio-modal');
    if (modal) {
      modal.classList.add('active');
      renderCardCanvas();
    }
  }

  function closeStudio() {
    const modal = document.getElementById('card-studio-modal');
    if (modal) modal.classList.remove('active');
  }

  // Global Export
  window.CardStudio = {
    open: openStudio,
    close: closeStudio,
    render: renderCardCanvas
  };

})(window);
