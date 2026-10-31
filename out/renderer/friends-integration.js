// SKLauncher Ultra - Friends Network Hub Overlay
// Safe DOM integration completely isolated from Svelte 5

(function initFriendsNetwork() {
  if (typeof window === 'undefined') return;

  let overlayEl = null;
  let isOpen = false;
  let currentFriends = [];
  let myIdentity = null;
  let refreshTimer = null;

  function onReady() {
    try {
      createSidebarTrigger();
      createFriendsModal();
      setupKeyboard();
    } catch (err) {
      console.error('[FriendsNetwork] Init error:', err);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(onReady, 500);
  } else {
    window.addEventListener('DOMContentLoaded', onReady);
  }

  // 1. Sleek Floating Trigger Button in Left Sidebar
  function createSidebarTrigger() {
    if (document.getElementById('sk-friends-trigger')) return;

    const trigger = document.createElement('button');
    trigger.id = 'sk-friends-trigger';
    trigger.type = 'button';
    trigger.title = 'Friends Network (Press F or Click)';
    trigger.setAttribute('aria-label', 'Open Friends Network');

    // Styled to sit comfortably in the sidebar above the settings cog (left: 14px, bottom: 68px)
    trigger.style.cssText = `
      position: fixed;
      left: 14px;
      bottom: 68px;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #27272a;
      border: 1px solid #3f3f46;
      color: #f4f4f5;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      padding: 0;
    `;

    trigger.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
      <span style="position: absolute; top: -3px; right: -3px; width: 10px; height: 10px; border-radius: 50%; background: #10b981; border: 2px solid #18181b; box-shadow: 0 0 8px #10b981;"></span>
    `;

    trigger.addEventListener('mouseenter', () => {
      trigger.style.background = '#3f3f46';
      trigger.style.borderColor = '#10b981';
      trigger.style.transform = 'scale(1.06)';
    });

    trigger.addEventListener('mouseleave', () => {
      trigger.style.background = '#27272a';
      trigger.style.borderColor = '#3f3f46';
      trigger.style.transform = 'scale(1)';
    });

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFriendsModal();
    });

    document.body.appendChild(trigger);
  }

  // 2. Full-Page Isolated Modal Overlay
  function createFriendsModal() {
    if (document.getElementById('sk-friends-modal-overlay')) return;

    overlayEl = document.createElement('div');
    overlayEl.id = 'sk-friends-modal-overlay';
    overlayEl.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 100000;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(10, 10, 12, 0.82);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      animation: skFadeIn 0.2s ease-out;
    `;

    overlayEl.innerHTML = `
      <div id="sk-friends-dialog" style="
        width: 92%;
        max-width: 760px;
        max-height: 88vh;
        background: #18181b;
        border: 1px solid #27272a;
        border-radius: 20px;
        box-shadow: 0 25px 60px -15px rgba(0,0,0,0.9);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: #f4f4f5;
      ">
        <!-- Header -->
        <div style="
          padding: 20px 24px;
          border-bottom: 1px solid #27272a;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #202024;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="
              width: 38px;
              height: 38px;
              border-radius: 10px;
              background: rgba(16, 185, 129, 0.15);
              border: 1px solid rgba(16, 185, 129, 0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #10b981;
            ">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h2 style="font-size: 18px; font-weight: 700; margin: 0; color: #fff;">Friends Network Hub</h2>
                <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; background: #27272a; color: #a1a1aa; padding: 2px 7px; border-radius: 6px; letter-spacing: 0.5px;">P2P Ultra</span>
              </div>
              <p style="font-size: 12px; color: #71717a; margin: 3px 0 0 0;">Connect with cracked and premium friends, view live servers & join seamlessly</p>
            </div>
          </div>
          <button type="button" id="sk-friends-close-btn" style="
            background: transparent;
            border: none;
            color: #71717a;
            cursor: pointer;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div style="padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px;">
          <!-- Profile Card -->
          <div id="sk-my-profile-card" style="
            background: #202024;
            border: 1px solid #27272a;
            border-radius: 14px;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
          ">
            <div style="display: flex; align-items: center; gap: 14px;">
              <img id="sk-my-avatar" src="https://mc-heads.net/avatar/MHF_Steve/56" alt="Avatar" style="
                width: 56px;
                height: 56px;
                border-radius: 12px;
                border: 2px solid #3f3f46;
                background: #18181b;
                object-fit: cover;
              "/>
              <div>
                <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #10b981; letter-spacing: 0.5px;">Your Profile</div>
                <div id="sk-my-username" style="font-size: 16px; font-weight: 700; color: #fff; margin-top: 2px;">Loading...</div>
                <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                  <span style="font-size: 12px; color: #a1a1aa;">Friend Code:</span>
                  <span id="sk-my-code" style="font-family: monospace; font-size: 13px; font-weight: 700; color: #38bdf8; background: #18181b; padding: 2px 6px; border-radius: 6px; border: 1px solid #27272a;">SK-....-....</span>
                </div>
              </div>
            </div>
            <button type="button" id="sk-copy-my-code-btn" style="
              background: #27272a;
              border: 1px solid #3f3f46;
              color: #f4f4f5;
              padding: 9px 16px;
              border-radius: 10px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy Code</span>
            </button>
          </div>

          <!-- Add Friend Form -->
          <div style="background: #202024; border: 1px solid #27272a; border-radius: 14px; padding: 18px 20px;">
            <div style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 4px;">Add a Friend</div>
            <p style="font-size: 12px; color: #71717a; margin: 0 0 12px 0;">Enter your friend's code to automatically synchronize online status and game server.</p>
            <form id="sk-add-friend-form" style="display: flex; gap: 10px; align-items: center;">
              <input type="text" id="sk-friend-code-input" placeholder="e.g. SK-49A1-BC82" maxlength="16" style="
                flex: 1;
                background: #18181b;
                border: 1px solid #3f3f46;
                color: #fff;
                padding: 10px 14px;
                border-radius: 10px;
                font-family: monospace;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
              "/>
              <button type="submit" id="sk-add-submit-btn" style="
                background: #10b981;
                border: none;
                color: #fff;
                padding: 10px 20px;
                border-radius: 10px;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                transition: background 0.2s;
                white-space: nowrap;
              ">Add Friend</button>
            </form>
            <div id="sk-add-status-msg" style="font-size: 12px; margin-top: 8px; min-height: 16px;"></div>
          </div>

          <!-- Friends List -->
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <div style="font-size: 14px; font-weight: 700; color: #fff;">Friends List</div>
              <div id="sk-friends-count" style="font-size: 12px; color: #71717a;">0 Friends</div>
            </div>
            <div id="sk-friends-list-container" style="display: flex; flex-direction: column; gap: 10px;">
              <!-- Dynamic friends cards inserted here -->
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlayEl);

    // Event listeners
    const closeBtn = document.getElementById('sk-friends-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('mouseenter', () => { closeBtn.style.color = '#fff'; closeBtn.style.background = '#27272a'; });
      closeBtn.addEventListener('mouseleave', () => { closeBtn.style.color = '#71717a'; closeBtn.style.background = 'transparent'; });
      closeBtn.addEventListener('click', closeFriendsModal);
    }

    overlayEl.addEventListener('click', (e) => {
      if (e.target === overlayEl) closeFriendsModal();
    });

    const copyBtn = document.getElementById('sk-copy-my-code-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (!myIdentity || !myIdentity.friendCode) return;
        navigator.clipboard.writeText(myIdentity.friendCode);
        copyBtn.innerHTML = `<span>Copied!</span>`;
        copyBtn.style.borderColor = '#10b981';
        copyBtn.style.color = '#10b981';
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy Code</span>
          `;
          copyBtn.style.borderColor = '#3f3f46';
          copyBtn.style.color = '#f4f4f5';
        }, 1800);
      });
    }

    const addForm = document.getElementById('sk-add-friend-form');
    if (addForm) {
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('sk-friend-code-input');
        const statusMsg = document.getElementById('sk-add-status-msg');
        const code = input.value.trim().toUpperCase();

        if (!code || code.length < 5) {
          statusMsg.textContent = 'Please enter a valid friend code (e.g. SK-XXXX-XXXX).';
          statusMsg.style.color = '#f43f5e';
          return;
        }

        try {
          if (window.api && window.api.p2pFriends) {
            const res = await window.api.p2pFriends.addFriend(code);
            if (res && res.success) {
              statusMsg.textContent = 'Friend added successfully!';
              statusMsg.style.color = '#10b981';
              input.value = '';
              fetchAndUpdate();
            } else {
              statusMsg.textContent = res.error || 'Could not add friend.';
              statusMsg.style.color = '#f43f5e';
            }
          }
        } catch (err) {
          statusMsg.textContent = 'Error: ' + err.message;
          statusMsg.style.color = '#f43f5e';
        }
      });
    }
  }

  function setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeFriendsModal();
      }
    });
  }

  function toggleFriendsModal() {
    if (isOpen) {
      closeFriendsModal();
    } else {
      openFriendsModal();
    }
  }

  function openFriendsModal() {
    if (!overlayEl) return;
    isOpen = true;
    overlayEl.style.display = 'flex';
    fetchAndUpdate();
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(fetchAndUpdate, 4000);
  }

  function closeFriendsModal() {
    if (!overlayEl) return;
    isOpen = false;
    overlayEl.style.display = 'none';
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  async function fetchAndUpdate() {
    if (!window.api || !window.api.p2pFriends) return;

    try {
      // 1. Identity
      if (!myIdentity) {
        myIdentity = await window.api.p2pFriends.getMyIdentity();
        if (myIdentity) {
          const userEl = document.getElementById('sk-my-username');
          const codeEl = document.getElementById('sk-my-code');
          const avatarEl = document.getElementById('sk-my-avatar');
          if (userEl) userEl.textContent = myIdentity.username || 'Minecraft Player';
          if (codeEl) codeEl.textContent = myIdentity.friendCode || 'SK-XXXX-XXXX';
          if (avatarEl) {
            avatarEl.src = `https://mc-heads.net/avatar/${encodeURIComponent(myIdentity.username || 'MHF_Steve')}/56`;
          }
        }
      }

      // 2. Friends list
      const friends = await window.api.p2pFriends.listFriends();
      currentFriends = friends || [];
      renderFriendsList();
    } catch (err) {
      console.warn('[FriendsNetwork] Fetch failed:', err);
    }
  }

  function renderFriendsList() {
    const container = document.getElementById('sk-friends-list-container');
    const countEl = document.getElementById('sk-friends-count');
    if (!container) return;

    if (countEl) countEl.textContent = `${currentFriends.length} Friend${currentFriends.length === 1 ? '' : 's'}`;

    if (currentFriends.length === 0) {
      container.innerHTML = `
        <div style="
          padding: 36px 20px;
          text-align: center;
          background: #202024;
          border: 1px dashed #3f3f46;
          border-radius: 14px;
        ">
          <div style="color: #a1a1aa; font-size: 14px; font-weight: 600;">No friends added yet</div>
          <p style="color: #71717a; font-size: 12px; margin: 4px auto 0; max-width: 320px;">
            Share your Friend Code with other players or enter their code above to see when they are playing!
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = currentFriends.map(f => {
      const isPlayingServer = f.status === 'in-game' && f.server;
      const isPlayingSolo = f.status === 'playing-solo' || (f.status === 'in-game' && !f.server);
      const isOnline = f.status === 'online';

      let statusBadge = `
        <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #10b981; font-weight: 600;">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981;"></span>
          Online in Launcher
        </span>
      `;

      if (isPlayingServer) {
        statusBadge = `
          <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #a855f7; font-weight: 700;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #a855f7; box-shadow: 0 0 6px #a855f7;"></span>
            Playing on ${escapeHtml(f.server)}
          </span>
        `;
      } else if (isPlayingSolo) {
        statusBadge = `
          <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #38bdf8; font-weight: 600;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #38bdf8;"></span>
            Playing Singleplayer
          </span>
        `;
      } else if (!isOnline) {
        statusBadge = `
          <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #71717a;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #52525b;"></span>
            Offline
          </span>
        `;
      }

      return `
        <div style="
          background: #202024;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        ">
          <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
            <img src="${f.avatarUrl || `https://mc-heads.net/avatar/${encodeURIComponent(f.username)}/44`}" alt="${escapeHtml(f.username)}" style="
              width: 44px;
              height: 44px;
              border-radius: 10px;
              border: 1px solid #3f3f46;
              background: #18181b;
              object-fit: cover;
              flex-shrink: 0;
            " onerror="this.src='https://mc-heads.net/avatar/MHF_Steve/44'"/>
            <div style="min-width: 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 14px; font-weight: 700; color: #fff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${escapeHtml(f.username)}</span>
                <span style="font-family: monospace; font-size: 11px; color: #71717a;">${escapeHtml(f.friendCode)}</span>
              </div>
              <div style="margin-top: 3px;">
                ${statusBadge}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            ${isPlayingServer ? `
              <button type="button" class="sk-join-btn" data-server="${escapeHtml(f.server)}" style="
                background: #10b981;
                border: none;
                color: #fff;
                padding: 6px 14px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
                transition: background 0.15s;
              ">Join Server</button>
            ` : ''}
            <button type="button" class="sk-remove-btn" data-code="${escapeHtml(f.friendCode)}" title="Remove Friend" style="
              background: transparent;
              border: none;
              color: #71717a;
              cursor: pointer;
              padding: 6px;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: color 0.15s;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach join server handlers
    container.querySelectorAll('.sk-join-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const server = btn.getAttribute('data-server');
        if (server) {
          navigator.clipboard.writeText(server);
          btn.textContent = 'IP Copied!';
          btn.style.background = '#059669';
          setTimeout(() => {
            btn.textContent = 'Join Server';
            btn.style.background = '#10b981';
          }, 2000);
        }
      });
    });

    // Attach remove handlers
    container.querySelectorAll('.sk-remove-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const code = btn.getAttribute('data-code');
        if (code && confirm(`Remove friend ${code}?`)) {
          if (window.api && window.api.p2pFriends) {
            await window.api.p2pFriends.removeFriend(code);
            fetchAndUpdate();
          }
        }
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }
})();
