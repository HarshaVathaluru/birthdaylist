/**
 * Zenitude Workspace — Memories & Photo Upload Engine
 * Live drag-and-drop photo upload, instantaneous preview, category filtering & full-screen lightbox
 */

(function () {
  'use strict';

  let selectedPhotoBase64 = null;
  const grid = document.getElementById('memories-grid');
  const addModal = document.getElementById('add-memory-modal');
  const openModalBtn = document.getElementById('open-add-memory-btn');
  const closeModalBtn = document.getElementById('close-memory-modal-btn');
  const fileInput = document.getElementById('memory-file-input');
  const dropzone = document.getElementById('memory-dropzone');
  const previewBox = document.getElementById('memory-preview-box');
  const previewImg = document.getElementById('memory-preview-img');
  const removePhotoBtn = document.getElementById('remove-photo-btn');
  const addMemoryForm = document.getElementById('add-memory-form');
  const lightboxModal = document.getElementById('photo-lightbox-modal');
  const closeLightboxBtn = document.getElementById('close-lightbox-btn');

  // Load existing memories from server on start
  async function loadServerMemories() {
    try {
      const res = await fetch('/api/memories');
      if (res.ok) {
        const memories = await res.json();
        memories.forEach(m => renderMemoryCard(m, false));
      }
    } catch (e) {
      console.warn('[Memories] Error loading from server:', e);
    }
  }

  // Render a memory card in the grid
  function renderMemoryCard(m, prepend = true) {
    if (!grid) return;

    // Avoid duplicate IDs
    if (m.id && document.querySelector(`[data-memory-id="${m.id}"]`)) return;

    const card = document.createElement('div');
    card.className = 'memory-card';
    card.setAttribute('data-category', m.category || 'celebrations');
    if (m.id) card.setAttribute('data-memory-id', m.id);

    const hasPhoto = !!m.photo_data;
    const authorInit = (m.author_name || 'Z')[0].toUpperCase();
    const badgeText = m.badge_tag || 'TEAM HIGHLIGHT';

    const isAdmin = !!localStorage.getItem('zenitude_admin_token');

    card.innerHTML = `
      <div class="memory-tape"></div>
      <div class="memory-photo-box" style="cursor: pointer;" title="Click to view full photo">
        ${hasPhoto 
          ? `<img src="${m.photo_data}" alt="${escapeHtml(m.title)}">` 
          : `<span class="memory-placeholder-art">📸✨</span>`
        }
        <span class="memory-badge-tag">${escapeHtml(badgeText)}</span>
      </div>
      <div class="memory-body">
        <h3 class="memory-title">${escapeHtml(m.title)}</h3>
        <p class="memory-caption">${escapeHtml(m.caption || '')}</p>
        <div class="memory-meta-info">
          <div class="memory-author">
            <span class="memory-author-avatar">${authorInit}</span>
            <span>${escapeHtml(m.author_name || 'Circle Member')}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>${escapeHtml(m.date_str || 'Today')}</span>
            ${isAdmin && m.id ? `<button type="button" class="btn-delete-memory-card" title="Delete Memory (Admin)" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); color: #EF4444; border-radius: 8px; cursor: pointer; font-size: 0.8rem; padding: 3px 6px; transition: all 0.2s;">🗑️</button>` : ''}
          </div>
        </div>
      </div>
    `;

    // Admin Delete handler on card
    const deleteBtn = card.querySelector('.btn-delete-memory-card');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm(`Admin: Delete memory "${m.title}"?`)) return;
        try {
          const res = await fetch(`/api/memories/${m.id}`, { method: 'DELETE' });
          if (res.ok) {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            setTimeout(() => card.remove(), 300);
          } else {
            alert('Failed to delete memory.');
          }
        } catch (err) {
          alert('Network error deleting memory.');
        }
      });
    }

    // Click photo to open lightbox
    const photoBox = card.querySelector('.memory-photo-box');
    photoBox.addEventListener('click', () => {
      openLightbox({
        title: m.title,
        photo: m.photo_data || '',
        caption: m.caption || '',
        author: m.author_name || 'Circle Member',
        date: m.date_str || 'Today',
        badge: badgeText
      });
    });

    if (prepend && grid.firstChild) {
      grid.insertBefore(card, grid.firstChild);
    } else {
      grid.appendChild(card);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Modal Open / Close
  if (openModalBtn && addModal) {
    openModalBtn.addEventListener('click', () => {
      addModal.classList.add('active');
    });
  }

  if (closeModalBtn && addModal) {
    closeModalBtn.addEventListener('click', () => {
      addModal.classList.remove('active');
    });
  }

  if (addModal) {
    addModal.addEventListener('click', (e) => {
      if (e.target === addModal) addModal.classList.remove('active');
    });
  }

  // Lightbox Open / Close
  function openLightbox(data) {
    if (!lightboxModal) return;
    const img = document.getElementById('lightbox-img');
    const title = document.getElementById('lightbox-title');
    const badge = document.getElementById('lightbox-badge');
    const caption = document.getElementById('lightbox-caption');
    const author = document.getElementById('lightbox-author');
    const date = document.getElementById('lightbox-date');

    if (img) {
      if (data.photo) {
        img.src = data.photo;
        img.style.display = 'block';
      } else {
        img.style.display = 'none';
      }
    }

    if (title) title.textContent = data.title;
    if (badge) badge.textContent = data.badge;
    if (caption) caption.textContent = data.caption;
    if (author) author.textContent = data.author;
    if (date) date.textContent = data.date;

    lightboxModal.classList.add('active');
  }

  if (closeLightboxBtn && lightboxModal) {
    closeLightboxBtn.addEventListener('click', () => {
      lightboxModal.classList.remove('active');
    });
  }

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) lightboxModal.classList.remove('active');
    });
  }

  // Photo Dropzone & File Reading
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
      }
    });
  }

  // Process & Downscale image for quick loading
  function processFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 1200px width/height for fast transmission
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        selectedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.85);

        // Show live preview
        if (previewImg && previewBox && dropzone) {
          previewImg.src = selectedPhotoBase64;
          previewBox.style.display = 'block';
          dropzone.style.display = 'none';
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Remove Photo Preview
  if (removePhotoBtn && previewBox && dropzone) {
    removePhotoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectedPhotoBase64 = null;
      if (fileInput) fileInput.value = '';
      previewBox.style.display = 'none';
      dropzone.style.display = 'block';
    });
  }

  // Form Submit Handler
  if (addMemoryForm) {
    addMemoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = document.getElementById('memory-title-input').value.trim();
      const category = document.getElementById('memory-category-input').value;
      const badge_tag = document.getElementById('memory-badge-input').value.trim() || 'TEAM MEMORY';
      const author_name = document.getElementById('memory-author-input').value.trim() || 'Circle Member';
      const caption = document.getElementById('memory-caption-input').value.trim();

      if (!title) {
        alert('Please enter a memory title.');
        return;
      }

      const submitBtn = document.getElementById('submit-memory-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Publishing...';
      }

      const payload = {
        title,
        category,
        badge_tag,
        author_name,
        caption,
        photo_data: selectedPhotoBase64,
        date_str: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };

      try {
        const res = await fetch('/api/memories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const createdMemory = res.ok ? await res.json() : payload;
        renderMemoryCard(createdMemory, true);

        // Play Confetti
        if (typeof confetti === 'function') {
          confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
        }

        // Reset form & close modal
        addMemoryForm.reset();
        selectedPhotoBase64 = null;
        if (fileInput) fileInput.value = '';
        if (previewBox) previewBox.style.display = 'none';
        if (dropzone) dropzone.style.display = 'block';
        if (addModal) addModal.classList.remove('active');

      } catch (err) {
        console.error('Error saving memory:', err);
        renderMemoryCard(payload, true);
        if (addModal) addModal.classList.remove('active');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>📸 Publish Memory to Wall</span>';
        }
      }
    });
  }

  // Category Filter Handler
  const filterBtns = document.querySelectorAll('.memory-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      const cards = document.querySelectorAll('.memory-card');

      cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Init
  document.addEventListener('DOMContentLoaded', loadServerMemories);

})();

