document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const chatNameInput = document.getElementById('sender_name') || document.getElementById('chat-name');
  const chatMessageInput = document.getElementById('message_text') || document.getElementById('chat-message');
  const chatSubmitBtn = document.getElementById('submit-message-btn') || document.getElementById('chat-submit-btn');
  const chatMessagesList = document.getElementById('chat-messages-list');
  const chatCountBadge = document.getElementById('chat-count-badge');
  const chatEmptyState = document.getElementById('chat-empty-state');
  const navbar = document.getElementById('navbar');
  const emojiButtons = document.querySelectorAll('.emoji-chip, .btn-emoji-quick');
  const moodButtons = document.querySelectorAll('.note-mood-btn');
  const charCount = document.getElementById('char-count');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');

  // Character Counter
  function updateCharCount() {
    if (charCount && chatMessageInput) {
      charCount.textContent = chatMessageInput.value.length;
    }
  }

  if (chatMessageInput) {
    chatMessageInput.addEventListener('input', updateCharCount);
  }

  // Mood Starter Selectors
  moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      moodButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const prefix = btn.getAttribute('data-prefix');
      if (chatMessageInput && prefix) {
        chatMessageInput.value = prefix;
        chatMessageInput.focus();
        updateCharCount();
      }
    });
  });

  // Theme Management
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

  // Reply elements
  const replyingBanner = document.getElementById('replying-banner');
  const replyingToName = document.getElementById('replying-to-name');
  const replyingToPreview = document.getElementById('replying-to-preview');
  const cancelReplyBtn = document.getElementById('cancel-reply-btn');

  let currentReply = null; // { id, name, text }

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

  // Check URL query parameters for pre-filled wish
  const urlParams = new URLSearchParams(window.location.search);
  const msgParam = urlParams.get('message');
  const recipientParam = urlParams.get('recipient');

  if (msgParam && chatMessageInput) {
    chatMessageInput.value = msgParam;
    updateCharCount();
    chatForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    chatMessageInput.focus();
  }

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Quick emoji insertion
  emojiButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji;
      if (chatMessageInput && emoji) {
        chatMessageInput.value += emoji;
        updateCharCount();
        chatMessageInput.focus();
      }
    });
  });

  // Cancel reply button
  if (cancelReplyBtn) {
    cancelReplyBtn.addEventListener('click', () => {
      clearReply();
    });
  }

  function setReply(id, name, text) {
    currentReply = { id, name, text };
    if (replyingToName) replyingToName.textContent = `@${name}`;
    if (replyingToPreview) replyingToPreview.textContent = text.length > 50 ? text.slice(0, 50) + '...' : text;
    if (replyingBanner) replyingBanner.classList.remove('hidden');

    // Smooth scroll to form and focus
    chatForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    chatMessageInput.focus();
  }

  function clearReply() {
    currentReply = null;
    if (replyingBanner) replyingBanner.classList.add('hidden');
  }

  // Initial fetch and periodic polling
  fetchMessages();
  setInterval(fetchMessages, 8000);

  // Form submission
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = chatNameInput.value.trim();
    const message = chatMessageInput.value.trim();

    if (!name || !message) return;

    chatSubmitBtn.disabled = true;
    chatSubmitBtn.innerHTML = '<span>Sending...</span>';

    const payload = {
      name,
      message,
      reply_to_id: currentReply ? currentReply.id : null,
      reply_to_name: currentReply ? currentReply.name : null,
      reply_to_text: currentReply ? currentReply.text : null
    };

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        chatNameInput.value = '';
        chatMessageInput.value = '';
        clearReply();
        await fetchMessages();
        showUserToast(payload.reply_to_id ? 'Reply posted!' : 'Message posted to circle!', 'success');
      } else {
        const data = await response.json();
        showUserToast(data.error || 'Failed to send message', 'error');
      }
    } catch (err) {
      showUserToast('Network error. Please try again.', 'error');
    } finally {
      chatSubmitBtn.disabled = false;
      chatSubmitBtn.innerHTML = '<span>Send Message</span> <span>➤</span>';
    }
  });

  async function fetchMessages() {
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const messages = await res.json();
        renderMessages(messages);
      }
    } catch (err) {
      console.warn('Could not fetch messages', err);
    }
  }

  function renderMessages(messages) {
    chatMessagesList.innerHTML = '';
    const count = messages.length;
    chatCountBadge.textContent = `${count} Message${count !== 1 ? 's' : ''}`;

    if (count === 0) {
      chatEmptyState.classList.remove('hidden');
      return;
    }

    chatEmptyState.classList.add('hidden');

    // Show latest messages at the top
    const sorted = [...messages].reverse();

    sorted.forEach((msg, idx) => {
      const item = document.createElement('div');
      item.className = 'chat-message-item';
      item.style.animationDelay = `${Math.min(idx * 0.05, 0.3)}s`;

      const initials = getInitials(msg.sender_name);
      const timeStr = formatRelativeTime(msg.created_at);
      const avatarGrad = getAvatarGradient(msg.sender_name);

      // Render quoted reply if this message was a reply
      const replyQuoteHtml = msg.reply_to_name ? `
        <div class="chat-reply-quote">
          <span class="reply-quote-icon">↩</span>
          <div class="reply-quote-body">
            <span class="reply-quote-author">@${escapeHtml(msg.reply_to_name)}</span>
            <span class="reply-quote-text">"${escapeHtml(msg.reply_to_text || 'Message')}"</span>
          </div>
        </div>
      ` : '';

      item.innerHTML = `
        <div class="chat-sender-avatar" style="background: ${avatarGrad}; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">${escapeHtml(initials)}</div>
        <div class="chat-message-body">
          <div class="chat-message-header">
            <span class="chat-sender-name">${escapeHtml(msg.sender_name)}</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="chat-message-time" title="${escapeHtml(msg.created_at)}">⏳ ${timeStr}</span>
              <button type="button" class="btn-reply-action" data-msg-id="${msg.id}" data-msg-name="${escapeHtml(msg.sender_name)}" data-msg-text="${escapeHtml(msg.message_text.slice(0, 80))}">
                <span>↩ Reply</span>
              </button>
              <button type="button" class="btn-delete-msg" data-msg-id="${msg.id}" title="Delete Message">
                <span>🗑️</span>
              </button>
            </div>
          </div>
          ${replyQuoteHtml}
          <div class="chat-message-text">${escapeHtml(msg.message_text)}</div>
        </div>
      `;

      // Attach reply click listener
      item.querySelector('.btn-reply-action').addEventListener('click', () => {
        setReply(msg.id, msg.sender_name, msg.message_text);
      });

      // Attach delete click listener
      item.querySelector('.btn-delete-msg').addEventListener('click', (e) => {
        e.stopPropagation();
        window.showZenitudeConfirm({
          title: 'Delete Message?',
          message: 'Are you sure you want to delete this message from Circle Chat?',
          icon: '🗑️',
          confirmText: 'Delete Message',
          onConfirm: async () => {
            try {
              const res = await fetch(`/api/messages/${msg.id}`, { method: 'DELETE' });
              const data = await res.json();
              if (res.ok) {
                showUserToast('Message deleted', 'success');
                await fetchMessages();
              } else {
                showUserToast(data.error || 'Failed to delete message', 'error');
              }
            } catch (err) {
              showUserToast('Error deleting message', 'error');
            }
          }
        });
      });

      chatMessagesList.appendChild(item);
    });
  }

  function getInitials(name) {
    if (!name) return '💌';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function formatRelativeTime(dateString) {
    if (!dateString) return 'Recently';

    // Parse UTC or local sqlite datetime (YYYY-MM-DD HH:MM:SS)
    const normalizedStr = dateString.includes('T') ? dateString : dateString.replace(' ', 'T') + 'Z';
    const msgDate = new Date(normalizedStr);
    const now = new Date();
    const diffMs = now - msgDate;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 30) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 3) return `${diffDays}d ago`;

    return msgDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showUserToast(message, type = 'info') {
    if (window.showZenitudeNotification) {
      const isSuccess = type === 'success';
      const isError = type === 'error';
      window.showZenitudeNotification({
        title: isSuccess ? 'Success!' : (isError ? 'Notice' : 'Circle Update'),
        message: message,
        icon: isSuccess ? '✨' : (isError ? '⚠️' : '💬'),
        type: isSuccess ? 'success' : (isError ? 'warning' : 'info')
      });
      return;
    }

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
