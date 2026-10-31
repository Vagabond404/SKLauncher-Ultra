// SKLauncher Ultra - Integrated Friends Network Hub
// Seamless sidebar navigation and full-page Friends interface

(function initFriendsIntegration() {
  let isFriendsActive = false;
  let activeTabEl = null;
  let friendsViewEl = null;
  let refreshTimer = null;
  let myIdentity = null;
  let currentFriends = [];

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

  function setup() {
    // 1. Remove old bottom-right button if it exists
    const oldBtn = document.getElementById('sk-friends-btn');
    if (oldBtn) oldBtn.remove();

    // 2. Observe the sidebar to inject the Friends navigation item
    observeSidebar();
  }

  function observeSidebar() {
    const observer = new MutationObserver(() => {
      // Find the main sidebar navigation container
      const navContainer = document.querySelector('aside nav') || document.querySelector('nav') || document.querySelector('aside');
      if (navContainer && !document.getElementById('nav-item-friends')) {
        injectSidebarItem(navContainer);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Also check immediately
    const navContainer = document.querySelector('aside nav') || document.querySelector('nav') || document.querySelector('aside');
    if (navContainer) {
      injectSidebarItem(navContainer);
    }
  }

  function injectSidebarItem(navContainer) {
    if (document.getElementById('nav-item-friends')) return;

    // Find a good sibling to insert near (e.g. before settings or after customization)
    const btn = document.createElement('button');
    btn.id = 'nav-item-friends';
    btn.type = 'button';
    btn.className = 'group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-colors duration-150 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100';
    btn.setAttribute('title', 'Friends Network (Cracked & Premium)');
    btn.setAttribute('aria-label', 'Friends Network');
    btn.style.margin = '4px auto';

    // Users icon SVG (Lucide-style matching launcher)
    btn.innerHTML = `
      <svg class="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
      <span class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
      </span>
    `;

    // Hook click
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openFriendsView(btn);
    });

    // When other sidebar buttons are clicked, close Friends view
    document.addEventListener('click', (e) => {
      const targetBtn = e.target.closest('aside button, nav button');
      if (targetBtn && targetBtn !== btn && isFriendsActive) {
        closeFriendsView();
      }
    });

    // Append into navigation container
    navContainer.appendChild(btn);
  }

  function openFriendsView(navBtn) {
    isFriendsActive = true;
    activeTabEl = navBtn;

    // Highlight Friends nav button
    navBtn.className = 'group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-colors duration-150 bg-emerald-600/20 text-emerald-400 font-bold border border-emerald-500/30';

    // Locate the main page view container
    const mainView = document.querySelector('.page-scroll') || document.querySelector('main') || document.querySelector('#app > div > div:last-child');
    if (!mainView) return;

    // Hide original children
    for (let i = 0; i < mainView.children.length; i++) {
      if (mainView.children[i].id !== 'sk-friends-view') {
        mainView.children[i].style.display = 'none';
      }
    }

    // Create or show friends view container
    if (!friendsViewEl) {
      friendsViewEl = document.createElement('div');
      friendsViewEl.id = 'sk-friends-view';
      friendsViewEl.className = 'w-full max-w-5xl mx-auto p-4 sm:p-6 text-zinc-100 flex flex-col gap-6 animate-fadeIn';
      mainView.appendChild(friendsViewEl);
    } else {
      friendsViewEl.style.display = 'flex';
    }

    renderFriendsContent();

    // Start auto-refresh interval
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(fetchAndUpdate, 3000);
  }

  function closeFriendsView() {
    isFriendsActive = false;
    if (activeTabEl) {
      activeTabEl.className = 'group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-colors duration-150 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100';
    }

    if (friendsViewEl) {
      friendsViewEl.style.display = 'none';
    }

    const mainView = document.querySelector('.page-scroll') || document.querySelector('main') || document.querySelector('#app > div > div:last-child');
    if (mainView) {
      for (let i = 0; i < mainView.children.length; i++) {
        if (mainView.children[i].id !== 'sk-friends-view') {
          mainView.children[i].style.display = '';
        }
      }
    }

    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  async function fetchAndUpdate() {
    if (!window.api || !window.api.p2pFriends) return;
    try {
      myIdentity = await window.api.p2pFriends.getMyIdentity();
      currentFriends = await window.api.p2pFriends.listFriends();
      renderFriendsContent();
    } catch (e) {
      console.warn('[FriendsIntegration] Error updating friends data:', e.message);
    }
  }

  async function renderFriendsContent() {
    if (!friendsViewEl) return;

    if (!myIdentity && window.api && window.api.p2pFriends) {
      try {
        myIdentity = await window.api.p2pFriends.getMyIdentity();
        currentFriends = await window.api.p2pFriends.listFriends();
      } catch (e) {}
    }

    const friendCode = myIdentity ? myIdentity.friendCode : 'SK-LOAD-ING1';
    const username = myIdentity ? myIdentity.username : 'Player';
    const avatar = `https://mc-heads.net/avatar/${encodeURIComponent(username)}/64`;

    friendsViewEl.innerHTML = `
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="font-minecraft text-2xl sm:text-3xl font-bold text-white tracking-wide">Friends Network</h1>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              P2P Active
            </span>
          </div>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">Connect with friends on Cracked & Microsoft accounts with real-time server presence.</p>
        </div>
      </div>

      <!-- Top Row: My Profile & Add Friend -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- My Profile Card -->
        <div class="lg:col-span-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 shadow-lg backdrop-blur-sm">
          <img src="${avatar}" alt="${username}" class="w-16 h-16 rounded-xl border border-zinc-700 shadow-md bg-zinc-800 object-cover flex-shrink-0" onerror="this.src='https://mc-heads.net/avatar/MHF_Steve/64'"/>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-bold text-base text-white truncate">${username}</span>
              <span class="px-2 py-0.5 text-[10px] uppercase font-semibold rounded bg-zinc-800 text-zinc-300 border border-zinc-700">You</span>
            </div>
            <div class="flex items-center gap-2 mt-1.5">
              <span class="text-xs font-mono bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-emerald-400 font-semibold select-all">${friendCode}</span>
              <button id="sk-copy-my-code-btn" type="button" class="cursor-pointer text-xs font-medium px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition">Copy</button>
            </div>
            <div class="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Online in Launcher</span>
            </div>
          </div>
        </div>

        <!-- Add Friend Card -->
        <div class="lg:col-span-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg backdrop-blur-sm">
          <div>
            <h3 class="text-sm font-semibold text-white">Add a Friend</h3>
            <p class="text-xs text-zinc-400 mt-0.5">Enter your friend's unique Friend Code to add them.</p>
          </div>
          <form id="sk-add-friend-form" class="flex gap-2 mt-3">
            <input id="sk-friend-code-input" type="text" placeholder="e.g. SK-A1B2-C3D4" maxlength="12" class="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono uppercase transition"/>
            <button type="submit" class="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl transition flex items-center gap-1.5 flex-shrink-0">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
              <span>Add</span>
            </button>
          </form>
          <div id="sk-add-status-msg" class="text-xs mt-1.5 min-h-[18px]"></div>
        </div>
      </div>

      <!-- Friends List Section -->
      <div class="mt-2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <span>Friends</span>
            <span class="px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-300 border border-zinc-700">${currentFriends.length}</span>
          </h2>
          <span class="text-xs text-zinc-500">Auto-refreshes in real time</span>
        </div>

        ${currentFriends.length === 0 ? `
          <div class="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <div class="w-12 h-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-3 border border-zinc-700/50">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <p class="text-sm font-semibold text-zinc-300">No friends added yet</p>
            <p class="text-xs text-zinc-500 mt-1 max-w-sm">Share your friend code with your friends or ask them for theirs to see when they are online or playing on a server.</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${currentFriends.map(f => renderFriendCard(f)).join('')}
          </div>
        `}
      </div>
    `;

    // Hook events
    const copyBtn = document.getElementById('sk-copy-my-code-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(friendCode);
        copyBtn.textContent = 'Copied!';
        copyBtn.className = 'cursor-pointer text-xs font-medium px-2.5 py-1 rounded bg-emerald-600 text-white border border-emerald-500 transition';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
          copyBtn.className = 'cursor-pointer text-xs font-medium px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition';
        }, 1500);
      });
    }

    const addForm = document.getElementById('sk-add-friend-form');
    if (addForm) {
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('sk-friend-code-input');
        const statusMsg = document.getElementById('sk-add-status-msg');
        const val = input.value.trim().toUpperCase();

        if (!val || val.length < 6) {
          statusMsg.textContent = 'Please enter a valid Friend Code (e.g. SK-XXXX-XXXX).';
          statusMsg.className = 'text-xs mt-1.5 text-rose-400 font-medium';
          return;
        }

        try {
          const res = await window.api.p2pFriends.addFriend(val);
          if (res && res.success) {
            statusMsg.textContent = 'Friend added successfully!';
            statusMsg.className = 'text-xs mt-1.5 text-emerald-400 font-medium';
            input.value = '';
            fetchAndUpdate();
          } else {
            statusMsg.textContent = res.error || 'Could not add friend.';
            statusMsg.className = 'text-xs mt-1.5 text-rose-400 font-medium';
          }
        } catch (err) {
          statusMsg.textContent = 'Error: ' + err.message;
          statusMsg.className = 'text-xs mt-1.5 text-rose-400 font-medium';
        }
      });
    }

    // Hook remove buttons
    document.querySelectorAll('.sk-remove-friend-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const code = btn.getAttribute('data-code');
        if (confirm(`Remove this friend (${code}) from your list?`)) {
          await window.api.p2pFriends.removeFriend(code);
          fetchAndUpdate();
        }
      });
    });

    // Hook join server buttons
    document.querySelectorAll('.sk-join-server-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const server = btn.getAttribute('data-server');
        navigator.clipboard.writeText(server);
        btn.textContent = 'Server IP Copied!';
        setTimeout(() => { btn.textContent = 'Join Server'; }, 2000);
      });
    });
  }

  function renderFriendCard(f) {
    const isPlayingServer = f.status === 'in-game' && f.server;
    const isPlayingSolo = f.status === 'playing-solo' || (f.status === 'in-game' && !f.server);
    const isOnline = f.status === 'online';

    let statusText = 'Online in Launcher';
    let statusClass = 'text-emerald-400';
    let dotClass = 'bg-emerald-400';

    if (isPlayingServer) {
      statusText = `Playing on ${f.server}`;
      statusClass = 'text-purple-400 font-semibold';
      dotClass = 'bg-purple-400 animate-pulse';
    } else if (isPlayingSolo) {
      statusText = f.instanceName ? `Solo: ${f.instanceName}` : 'In Singleplayer Game';
      statusClass = 'text-sky-400 font-semibold';
      dotClass = 'bg-sky-400';
    } else if (!isOnline) {
      statusText = 'Offline';
      statusClass = 'text-zinc-500';
      dotClass = 'bg-zinc-600';
    }

    return `
      <div class="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 flex items-center justify-between gap-4 transition shadow-md">
        <div class="flex items-center gap-3.5 min-w-0">
          <img src="${f.avatarUrl || `https://mc-heads.net/avatar/${encodeURIComponent(f.username)}/48`}" alt="${f.username}" class="w-12 h-12 rounded-xl border border-zinc-700 bg-zinc-800 object-cover flex-shrink-0" onerror="this.src='https://mc-heads.net/avatar/MHF_Steve/48'"/>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white truncate">${f.username}</span>
              <span class="text-[10px] font-mono text-zinc-500">${f.friendCode}</span>
            </div>
            <div class="flex items-center gap-1.5 mt-1">
              <span class="w-2 h-2 rounded-full ${dotClass}"></span>
              <span class="text-xs truncate ${statusClass}">${statusText}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          ${isPlayingServer ? `
            <button type="button" data-server="${f.server}" class="sk-join-server-btn cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition shadow-sm">
              Join Server
            </button>
          ` : ''}
          <button type="button" data-code="${f.friendCode}" title="Remove Friend" class="sk-remove-friend-btn cursor-pointer p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `;
  }
})();
